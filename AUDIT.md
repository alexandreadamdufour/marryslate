# Audit pré-beta Amora — 2026-06-29

Rapport hiérarchisé issu d'un scan complet du repo (6 agents parallèles couvrant
actions, migrations/RLS, Stripe/paiements, secrets/config, queries/perf, RSVP/routes).
**Aucun fix appliqué à ce stade — audit seul.**

---

## 🔴 CRITIQUE — Perte de données possible

---

### C1 — `wedding_timeline` : toutes les écritures échouent silencieusement ✅ RÉSOLU 2026-06-29

**Migration :** `supabase/migrations/20260629010000_fix_budget_checklist_timeline_policies.sql`

**Cause confirmée :** Aucune policy DML coowner en base (seule une policy SELECT publique existait).
RLS activé + zéro policy write = default DENY sur toutes les mutations. Corrigé en ajoutant
`CREATE POLICY "Coowners can manage timeline" FOR ALL USING/WITH CHECK is_wedding_coowner(wedding_id)`.
Vérif post-apply OK (`pg_policies` + test navigateur).

---

### C2 — `budget_items` + `checklist_items` : même bug policies que seating ✅ RÉSOLU 2026-06-29

**Migration :** `supabase/migrations/20260629010000_fix_budget_checklist_timeline_policies.sql`

**Cause confirmée :** Les deux tables avaient une policy `FOR ALL` avec `auth.uid()` en base
(cast uuid → 22P02 avec les ids Clerk text), malgré les migrations originales qui indiquaient
`is_wedding_coowner`. Corrigé via DROP puis CREATE avec `is_wedding_coowner(wedding_id)`.
Vérif post-apply OK (`pg_policies` + test navigateur).

---

## 🟠 ÉLEVÉ — À corriger avant la beta

---

### E1 — Utilisateurs soft-deleted accèdent toujours au dashboard

**Fichier :** `src/app/(dashboard)/layout.tsx:14`

**Risque :** Le webhook Clerk `user.deleted` pose `deleted_at = NOW()` en DB. Les JWTs
Clerk existants restent valides 7 jours. Le layout dashboard ne filtre pas `deleted_at IS NULL`
→ l'utilisateur supprimé trouve sa row, accède au dashboard, et toutes ses Server Actions
fonctionnent via son JWT encore valide pendant toute la fenêtre de validité.

**Code fautif :**
```typescript
const { data: user } = await supabase
  .from("users")
  .select("id")
  .eq("clerk_user_id", userId)    // ← pas de .is("deleted_at", null)
  .maybeSingle()
```

**Fix proposé :**
```typescript
const { data: user } = await supabase
  .from("users")
  .select("id")
  .eq("clerk_user_id", userId)
  .is("deleted_at", null)         // ← add
  .maybeSingle()

if (!user) redirect("/connexion") // ← couvre deleted + no-record
```
Effort : 2 lignes.

---

### E2 — `exports.ts` : mauvais mariage exporté (fuite de données cross-tenant)

**Fichier :** `src/actions/exports.ts:38` (pattern répété dans les 3 fonctions d'export)

**Risque :** Un user co-owner de 2 mariages déclenche un export CSV. Sans `ORDER BY`,
PostgreSQL retourne n'importe lequel des deux mariage. Il peut silencieusement exporter
la liste d'invités, les contributions ou les retraits du **mauvais** mariage. Fuite de
données personnelles RGPD.

**Code fautif :**
```typescript
const { data: coowner } = await supabase
  .from("wedding_coowners")
  .select("wedding_id")
  .eq("user_id", user.id)
  .limit(1)          // ← ORDER BY absent → non-déterministe
  .maybeSingle()
```

**Fix proposé :** Passer `weddingId` explicitement aux 3 fonctions d'export et valider
avec `assertWeddingCoowner`. Alternative rapide : ajouter `.order("created_at", { ascending: true })`.

Effort : ~30 min (refactor propre) ou 2 lignes (tiebreaker stable).

---

### E3 — `requestPayout` : aucun Zod, NaN bypass, exception Stripe non catchée

**Fichier :** `src/actions/withdrawals.ts:117–143`

**Risque :** Aucun `safeParse` Zod. Avec `amountEuros = NaN` :
- `Math.round(NaN * 100)` = `NaN`
- `NaN < 100` = `false` → passe le guard minimum
- `NaN > balanceCentimes` = `false` → passe le check balance
- `createPayout(stripeAccountId, NaN)` throw une exception non catchée → 500 Next.js
- Le `withdrawal` row créé avant le throw reste en `"processing"` sans `stripe_payout_id`

**Fix proposé :**
```typescript
const schema = z.object({ amountEuros: z.number().finite().positive().min(1).max(10000) })
const parsed = schema.safeParse({ amountEuros })
if (!parsed.success) return { error: "INVALID_INPUT" }
// ...
try { payoutId = await createPayout(stripeAccountId, amountCentimes) }
catch (err) {
  console.error("[requestPayout] Stripe:", err)
  return { error: "STRIPE_API_ERROR" }
}
```
Effort : ~15 min.

---

### E4 — Guestbook sans rate limiting : flood email + spam illimité

**Fichier :** `src/actions/guestbook.ts:10`

**Risque :** Endpoint public anonyme, aucune limite. Chaque entrée avec
`notifications_enabled = true` déclenche un email Resend au couple. Plan Resend gratuit :
100 emails/jour — épuisable en quelques secondes via boucle. Le couple ne reçoit plus
ses vraies notifications (RSVP, contributions). La table `guestbook_messages` peut être
floodée sur tout mariage `is_published = true`.

**Fix proposé :** Réutiliser le pattern `checkRsvpRateLimit` de `src/lib/rate-limit.ts` :
```typescript
const ip = headers().get("x-forwarded-for") ?? "unknown"
const allowed = await checkGuestbookRateLimit(ip, input.weddingId)  // 5/IP/wedding/heure
if (!allowed) return { error: "RATE_LIMITED" }
```
Effort : ~20 min (ajout fonction dans `rate-limit.ts` + appel dans `guestbook.ts`).

---

### E5 — `wedding-access/route.ts` : brute-force parallèle bypass le délai 1s

**Fichier :** `src/app/api/wedding-access/route.ts:30`

**Risque :** Le `setTimeout(1000)` est **par requête individuelle**. Avec 100 connexions
simultanées côté attaquant, 100 codes sont testés en ~1 seconde. Code PIN 4 chiffres
(10 000 combos) → cassé en < 2 minutes. Aucun lockout, aucune limite IP.

**Fix proposé :**
```typescript
import { checkAccessCodeRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const allowed = await checkAccessCodeRateLimit(ip, slug)  // 10 tentatives/15 min
  if (!allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 })
  // ... suite (conserver le setTimeout 1s en complément)
```
Effort : ~20 min.

---

### E6 — `createPaymentIntent` + `uploadContributorPhoto` sans rate limiting

**Fichier :** `src/actions/contributions.ts:14` (createPaymentIntent) · `:59` (uploadContributorPhoto)

**Risque :** Deux endpoints publics (sans auth Clerk) sur tout mariage publié :
- `createPaymentIntent` : crée une row DB + un Stripe PaymentIntent par appel → flood =
  pollution table contributions + risque suspension compte Stripe sur détection d'anomalies.
- `uploadContributorPhoto` : 5 MB/upload sans limite de volume → saturation bucket
  Supabase Storage + coûts egress.

**Fix proposé :** Même pattern Upstash — 5 PaymentIntents/IP/wedding/heure, 10 photos/IP/wedding/heure.
L'IP est disponible via `headers().get("x-forwarded-for")` sur Vercel.
Effort : ~20 min (fonctions génériques dans `rate-limit.ts` + 2 appels).

---

## 🟡 MOYEN — Avant le scale

---

### M1 — Rate limit RSVP fail-open si Upstash absent

**Fichier :** `src/lib/rate-limit.ts:12`

**Risque :** `if (!process.env.UPSTASH_REDIS_REST_URL) return true` — si les vars Vercel
manquent (rotation, oubli de configuration), tout le rate limiting est désactivé sans
aucune alerte. Comportement attendu en dev local, silencieusement dangereux en prod.

**Fix proposé :** En `NODE_ENV === "production"`, logguer `console.error` ou retourner
`false` si Redis n'est pas configuré. Documenter dans le README de déploiement.

---

### M2 — Aucun header de sécurité HTTP

**Fichier :** `next.config.ts` (section `headers()` absente)

`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`,
`Referrer-Policy`, `Content-Security-Policy` absents. `poweredByHeader: false` présent.
XSS atténué par React mais défense en profondeur insuffisante.

**Fix proposé :** Ajouter `headers()` dans `next.config.ts` avec les 5 headers standards.
Effort : ~15 min.

---

### M3 — `createPaymentIntent` : rollback contribution silencieusement raté

**Fichier :** `src/actions/contributions.ts:133`

```typescript
} catch (err) {
  await supabase.from("contributions").delete().eq("id", contribution.id)
  // ← erreur du delete non vérifiée
  return { error: "STRIPE_ERROR" }
}
```

Si Stripe échoue ET que le delete échoue (FK, timeout), la contribution reste `pending`
indéfiniment → fausse les compteurs `current_amount` sur le gift. Accumulation silencieuse
de rows orphelines.

**Fix proposé :** Logguer l'erreur du delete. Ajouter un job de nettoyage (cron Supabase
ou Vercel) qui purge les contributions `pending` + `stripe_payment_intent_id IS NULL`
de plus de 1h.

---

### M4 — Erreurs DB avalées sans code dans ~15 actions

**Fichiers :** `src/actions/timeline.ts:60,88,112,134` · `src/actions/seating.ts:82,105,122,179`
· probablement aussi `story.ts`, `visual.ts`, `practical-info.ts`, `planner.ts`, `notifications.ts`

Ces fonctions retournent `{ error: "DB_ERROR" }` sans `console.error`. Un `error.code = "42501"`
ou `"23503"` est totalement perdu dans les logs Vercel. On a passé plusieurs heures à
diagnostiquer les bugs seating/guests exactement à cause de ça.

**Fix proposé :** Aligner sur le pattern déjà en place dans `guests.ts` et `createSeatingTable` :
```typescript
console.error("[fn]", { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint })
return { error: error?.message ?? "DB_ERROR" }
```

---

### M5 — `reorderTimeline` : partial update silencieux

**Fichier :** `src/actions/timeline.ts:134`

`Promise.all(positions.map(...update...))` sans vérifier les erreurs individuelles.
Un reorder partiellement échoué (timeout, RLS) → positions partiellement mises à jour,
UI désynchronisée, aucune erreur remontée au couple. Actif dès que C1 est corrigé.

**Fix proposé :**
```typescript
const results = await Promise.all(positions.map(...))
const failed = results.filter(r => r.error)
if (failed.length) return { error: "DB_ERROR" }
```

---

### M6 — `deleteSeatingTable` + `unassignGuest` : erreur delete swallowed

**Fichier :** `src/actions/seating.ts:122` · `:179`

```typescript
await supabase.from("seating_tables").delete().eq("id", tableId)
// ← résultat ignoré, retourne toujours { data: undefined }
```

Si la suppression échoue (RLS, contrainte FK), le client reçoit un succès silencieux.
La table ou l'assignation reste en base et l'UI est désynchronisée.

**Fix proposé :**
```typescript
const { error } = await supabase.from("seating_tables").delete().eq("id", tableId)
if (error) {
  console.error("[deleteSeatingTable]", { code: error.code, message: error.message })
  return { error: error.message ?? "DB_ERROR" }
}
```

---

### M7 — `users` table : colonnes ENUM avec policy UPDATE Clerk (22P02 latent)

**Fichier :** `supabase/migrations/20260624120000_initial_schema.sql:77`

`users.role` (`user_role` ENUM) et `users.kyc_status` (`kyc_status` ENUM) sont des
colonnes ENUM actives. La policy `users_update_own` autorise le client Clerk à faire des
UPDATE sur `users`. Si une Server Action actuelle ou future met à jour `users` via
`createClerkSupabaseClient()` → 22P02. Actuellement sûr si toutes les updates `users`
passent par service_role — à vérifier et documenter explicitement.

---

### M8 — Absence totale de tests

Aucun test unitaire, d'intégration ou e2e dans le repo. Les deux bugs critiques corrigés
lors de cette session (ENUM→text et seating policies auth.uid()) auraient été détectés
avant production avec des tests d'intégration.

**Flows critiques à couvrir en priorité :**
1. `createPaymentIntent` → webhook `payment_intent.succeeded` → `current_amount` mis à jour sur le gift
2. Ownership cross-wedding : coowner A ne peut pas muter le mariage B
3. RSVP : soumission valide, rate limit atteint, token absent
4. `requestPayout` : balance insuffisante, montant NaN, montant valide
5. Non-régression 22P02 sur guests/seating (les bugs de cette session)

---

## ⚪ FAIBLE — Cosmétique / amélioration

---

### F1 — `fix_auth_uid_clerk.sql` non marqué documentation-only

**Fichier :** `supabase/migrations/20260626050000_fix_auth_uid_clerk.sql`

Cette migration est inapplicable (bloquée par Supabase, permission denied sur le schéma
`auth`). Sans commentaire explicite, un futur développeur peut tenter de l'appliquer et
déboguer une erreur confuse.

**Fix proposé :** Ajouter en première ligne :
```sql
-- DOCUMENTATION ONLY — DO NOT APPLY.
-- Blocked by Supabase permission model (cannot redefine auth.uid()).
-- The fix was ENUM→text (see 20260626060000_enum_to_text.sql).
```

---

### F2 — `getOrCreateUser` : race condition possible (webhook + action simultanés)

**Fichier :** `src/actions/wedding.ts:16`

Double chemin de création d'un user (webhook Clerk + action directe en fallback). Si les
deux arrivent dans la même fenêtre, l'INSERT sans `ON CONFLICT (clerk_user_id) DO NOTHING`
peut provoquer un 23505 (unique violation). Probabilité faible, impact faible.

**Fix proposé :** Ajouter `.onConflict("clerk_user_id").ignore()` ou un
`ON CONFLICT (clerk_user_id) DO NOTHING` dans l'INSERT.

---

### F3 — Migration file / DB divergence sur `seating_tables`

**Fichier :** `supabase/migrations/20260626030000_seating.sql`

Ce fichier contient encore les anciennes policies avec `auth.uid()`. La DB réelle a été
corrigée par `20260629000000_fix_seating_policies.sql`. Un `db reset` / replay des
migrations depuis zéro recréerait les mauvaises policies.

**Fix proposé :** Mettre à jour `20260626030000_seating.sql` pour refléter les policies
correctes, ou ajouter un commentaire explicite renvoyant vers `20260629000000`.

---

### F4 — `seating.ts` : cast unsafe sur le join `seating_assignments → seating_tables`

**Fichier :** `src/actions/seating.ts:169`

```typescript
const weddingId = (row.seating_tables as { wedding_id: string } | null)?.wedding_id
```

Si la FK est renommée ou si le join change de forme, le cast masque l'erreur silencieusement.

**Fix proposé :** Utiliser le join `!inner` Supabase et laisser le type inféré automatiquement.

---

### F5 — Queries sans `.limit()` sur des tables potentiellement volumineuses

**Fichiers :** `src/queries/guests.ts` · `src/queries/contributions.ts` · `src/queries/planner.ts`

Ces queries sélectionnent tous les enregistrements d'un mariage sans pagination ni `.limit()`.
Acceptable à 100 invités, problématique à 1 000+.

**Fix proposé :** Ajouter pagination ou `.limit(500)` + warning côté UI au-delà d'un seuil.

---

## Récapitulatif exécutif

| Sévérité | # | Points |
|---|---|---|
| 🔴 CRITIQUE | 2 | ~~C1 timeline cassé~~ ✅ · ~~C2 budget/checklist à vérifier~~ ✅ |
| 🟠 ÉLEVÉ | 6 | E1 soft-delete bypass · E2 export cross-tenant · E3 requestPayout NaN · E4 guestbook spam · E5 brute-force access code · E6 rate limiting manquant |
| 🟡 MOYEN | 8 | M1 rate limit fail-open · M2 security headers · M3 rollback contrib · M4 erreurs DB silencieuses · M5 reorderTimeline partial · M6 delete sans check · M7 ENUM users latent · M8 zéro tests |
| ⚪ FAIBLE | 5 | F1 migration doc-only · F2 race condition user · F3 divergence fichier/DB seating · F4 cast unsafe seating · F5 queries sans limit |

**Ordre de traitement suggéré avant beta :**
1. Vérifier C2 (pg_policies sur budget_items/checklist_items) — 2 min
2. C1 : migration timeline policy — 10 min
3. E3 : Zod sur requestPayout + try/catch Stripe — 15 min
4. E4 + E5 + E6 : rate limiting guestbook + access code + contributions (un seul diff rate-limit.ts + 3 actions) — 45 min
5. E2 : soft-delete filter layout.tsx — 2 lignes
6. E1 : exports.ts weddingId explicite — 30 min

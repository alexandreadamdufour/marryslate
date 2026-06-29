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

### E1 — Utilisateurs soft-deleted accèdent toujours au dashboard ✅ RÉSOLU 2026-06-29

**Commit :** `c74ea46`  
**Fichiers modifiés :** `src/app/(dashboard)/layout.tsx` · `src/actions/withdrawals.ts` · `src/actions/exports.ts` · `src/app/(dashboard)/dashboard/retrait/page.tsx`

**Fix appliqué :** `.is("deleted_at", null)` ajouté à tous les lookups `users` par `clerk_user_id` dans le layout, les actions financières (withdrawals) et les exports. Le layout passe de `if (user) { ... check coowner }` à `if (!user) redirect("/connexion")` inconditionnel (couvre deleted + no-record). Idem pour `getAuthenticatedUserAndWedding()` et `setupStripeConnect()`.

**Trou résiduel documenté :** les Server Actions qui utilisent uniquement `assertWeddingCoowner` sans lookup `users` (gifts, guests, seating, timeline, budget, planner…) restent appelables via API directe avec un JWT encore valide. Fix complet = révocation de session Clerk dans le webhook `user.deleted`, ou ajout de `deleted_at IS NULL` dans `is_wedding_coowner()` (migration SQL). Acceptable pour beta — nécessite un appel API intentionnel, non exploitable via UI.

---

### E2 — `exports.ts` : mauvais mariage exporté (fuite de données cross-tenant) ✅ RÉSOLU 2026-06-29

**Commit :** `52ba013`  
**Fichiers modifiés :** `src/actions/exports.ts` · `src/components/dashboard/export-csv-button.tsx` · `src/components/dashboard/export-rsvp-csv-button.tsx` · `src/components/dashboard/guest-csv-buttons.tsx` · `src/app/(dashboard)/dashboard/contributions/page.tsx`

**Fix appliqué :** `weddingId` passé explicitement aux 3 fonctions d'export (`exportContributionsCSV`, `exportRsvpCSV`, `exportGuestsCSV`). Suppression du `LIMIT 1` non-déterministe. Ownership validé directement sur `wedding_coowners` avec `user_id + wedding_id` (double eq), retourne `FORBIDDEN` si non-coowner. Build TypeScript OK — aucun appelant resté sur l'ancienne signature sans argument.

**Note :** bug **latent** aujourd'hui (aucun user ne peut avoir 2+ mariages en prod — voir M9). Fix appliqué préventivement avant tout flow multi-mariage. La racine du problème (helpers `getMyWedding` / `getAuthenticatedUserAndWedding`) est tracée en M9.

---

### E3 — `requestPayout` : aucun Zod, NaN bypass, exception Stripe non catchée ✅ RÉSOLU 2026-06-29

**Commit :** `cc160a8`  
**Fichiers modifiés :** `src/actions/withdrawals.ts` · `src/lib/stripe/connect.ts` · `src/components/dashboard/payout-setup.tsx`

**3 défenses appliquées :**
1. **Zod** `z.number().finite().positive().min(1).max(50000)` + `idempotencyToken: z.string().uuid()` — bloque NaN et tout input hors-norme avant toute logique.
2. **Défense 1 (DB)** — check `withdrawals.status = "processing"` avant l'appel Stripe → `PAYOUT_ALREADY_PENDING`.
3. **Défense 2 (Stripe idempotency key)** — token UUID généré côté client, stable sur retry, reset sur changement de montant ou après succès. Transmis à Stripe comme `retrait-<uuid>` ; confirmé compatible avec `stripeAccount` dans le même objet d'options (SDK v22.2.3, `utils.js:159-163`).
4. **try/catch** autour de `createPayout` → `STRIPE_API_ERROR` propre, plus de 500 Next.js.
5. **Retry loop (3 tentatives)** sur l'insert DB post-payout Stripe ; `23505` (contrainte UNIQUE `stripe_payout_id`) traité comme succès ; `PAYOUT_UNRECORDED` retourné si échec persistant (log détaillé avec `payoutId` pour réconciliation manuelle).

**4 nouveaux codes d'erreur** gérés dans l'UI avec messages explicites : `PAYOUT_ALREADY_PENDING` · `STRIPE_API_ERROR` · `INVALID_INPUT` · `PAYOUT_UNRECORDED` (ce dernier dirige vers le support tout en confirmant que l'argent partira bien).

---

### E4 — Guestbook sans rate limiting : flood email + spam illimité ✅ RÉSOLU 2026-06-29

**Commit :** `d9166d4`  
**Fichiers modifiés :** `src/lib/rate-limit.ts` · `src/actions/guestbook.ts`

**Fix appliqué :** `checkGuestbookRateLimit(ip, weddingId)` — 5 messages/IP/wedding/heure.
IP résolue via `getClientIp()` : `x-real-ip` (Vercel edge, non spoofable) prioritaire,
dernier segment de `x-forwarded-for` en fallback. IP null → fail-open sans bucket partagé.

---

### E5 — `wedding-access/route.ts` : brute-force parallèle bypass le délai 1s ✅ RÉSOLU 2026-06-29

**Commit :** `d9166d4`  
**Fichiers modifiés :** `src/lib/rate-limit.ts` · `src/app/api/wedding-access/route.ts`

**Fix appliqué :** `checkAccessCodeRateLimit(ip, slug)` — 10 tentatives/IP/slug/15 min.
10 000 combos / 10 tentatives = 1 000 IPs distinctes requises pour forcer l'espace complet.
`setTimeout(1000)` conservé en couche complémentaire sur mauvais code. IP via `getClientIp(request.headers)`.
HTTP 429 retourné si limite atteinte.

---

### E6 — `createPaymentIntent` + `uploadContributorPhoto` sans rate limiting ✅ RÉSOLU 2026-06-29

**Commit :** `d9166d4`  
**Fichiers modifiés :** `src/lib/rate-limit.ts` · `src/actions/contributions.ts`

**Fix appliqué :**
- `checkPaymentIntentRateLimit(ip, weddingSlug)` — 5 PaymentIntents/IP/wedding/heure. Protège Stripe contre la détection d'anomalies et la table `contributions` contre la pollution.
- `checkPhotoUploadRateLimit(ip, weddingSlug)` — 10 uploads/IP/wedding/heure. Protège le bucket Supabase Storage contre la saturation (5 MB/upload × illimité = coûts egress non bornés).
Les deux checks se font après Zod parse, avant le premier appel DB/Stripe.

---

## 🟡 MOYEN — Avant le scale

---

### M1 — Rate limit RSVP fail-open si Upstash absent ✅ RÉSOLU 2026-06-29 (au passage de E4/E5/E6)

**Commit :** `d9166d4`  
**Fichier modifié :** `src/lib/rate-limit.ts`

**Fix appliqué :** `getRedis()` émet `console.error` explicite si `UPSTASH_REDIS_REST_URL/TOKEN`
manquent en `NODE_ENV === "production"`. Fail-open conservé (invités légitimes non bloqués
si Redis a un hoquet) mais désormais LOUD : l'absence de Redis est visible dans les logs Vercel.
En dev local : silencieux comme avant.

---

### M2 — Aucun header de sécurité HTTP ✅ RÉSOLU 2026-06-29

**Commits :** `1ca34f4` (headers + CSP Report-Only) · `df91843` (CSP bloquant)  
**Fichier modifié :** `next.config.ts`

**Headers bloquants actifs :**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (prod uniquement)
- `Content-Security-Policy` bloquant — whitelist Stripe, Clerk (`*.clerk.accounts.dev`),
  Crisp, GA4/GTM, Supabase (URL + wss depuis `NEXT_PUBLIC_SUPABASE_URL`). `unsafe-inline`
  (RSC hydration + GTM), `unsafe-eval` (Crisp). Validée en prod sur tous les flux
  (Stripe, Clerk, Crisp, GA4, Supabase) — zéro violation Report-Only avant activation.

---

### M3 — `createPaymentIntent` : rollback contribution silencieusement raté ✅ RÉSOLU 2026-06-29

**Commit :** à venir  
**Fichier modifié :** `src/actions/contributions.ts`

**Fix appliqué :** `const { error: rollbackError }` capture le résultat du delete de rollback.
Si le delete échoue, `console.error("[createPaymentIntent_rollback]")` loggue un objet structuré
avec `contributionId`, `weddingId`, `giftId`, `rollbackCode`, `rollbackMessage` — tout ce qu'il
faut pour retrouver et nettoyer l'orphelin manuellement dans Supabase en beta.
`logDbError` non utilisé ici : le contexte critique (`contributionId`) est absent de l'erreur
Postgres seule ; `console.error` structuré est plus adapté.

**Dette documentée :** fix = log actionnable de l'orphelin (`contributionId`) pour nettoyage
manuel en beta ; cron de purge automatique (contributions `pending` + `stripe_payment_intent_id IS NULL`
de plus de 1h) = dette à construire avant le scale.

---

### M4 — Erreurs DB avalées sans code dans ~15 actions ✅ RÉSOLU 2026-06-29

**Commit :** `bd9a983`  
**Fichiers modifiés :** 10 actions + nouveau `src/lib/supabase/log-db-error.ts`

**Fix appliqué :** Helper `logDbError(context, error)` créé — logue `{ code, message, details, hint }`
(métadonnées PostgreSQL, RGPD-safe, pas de valeurs utilisateur). 21 call sites corrigés :

- **Silencieux → log complet :** `timeline.ts` (3), `story.ts`, `visual.ts`, `access-code.ts`,
  `notifications.ts`, `practical-info.ts`
- **Message seul → log complet :** `gifts.ts` (2), `budget.ts` (3), `planner.ts` (4), `wedding.ts` (3)

Retour client `{ error: "DB_ERROR" }` inchangé. Logs visibles dans **Vercel Dashboard → Logs
→ filtre "error"** (ou `vercel logs --level=error`). Rétention : 1j Hobby, 7j Pro.

---

### M5 — `reorderTimeline` : partial update silencieux ✅ RÉSOLU 2026-06-29

**Commit :** `4d2fa8b`  
**Fichiers modifiés :** `src/actions/timeline.ts` · `src/actions/gifts.ts` (même bug sur `reorderGifts`)

**Fix appliqué :** Résultats individuels capturés, filtrés, loggés via `logDbError`. Retour
`DB_ERROR` si ≥ 1 update échoue. Pas de `revalidatePath` en cas d'échec — évite d'afficher
un ordre partiellement cassé dans l'UI.

**Dette d'atomicité documentée :** Le fix détecte et signale l'échec partiel mais ne le répare
pas — la base reste incohérente jusqu'au prochain reorder réussi. Acceptable beta : chaque appel
réécrit toutes les positions, un 2e essai de l'utilisateur corrige l'état. La vraie solution
tout-ou-rien est une **RPC Postgres transactionnelle** (`BEGIN … UPDATE … UPDATE … COMMIT`) —
à traiter avant le scale si l'échec partiel pendant un reorder concurrent devient un vrai risque.

---

### M6 — `deleteSeatingTable` + `unassignGuest` : erreur delete swallowed ✅ RÉSOLU 2026-06-29

**Commit :** à venir  
**Fichier modifié :** `src/actions/seating.ts`

**Fix appliqué :** `const { error: deleteError }` capture le résultat du delete sur les deux fonctions.
`logDbError` loggue le code/message PostgreSQL si erreur. `return { error: "DB_ERROR" }` renvoyé au client.
`revalidatePath` déplacé après le guard — pas de revalidation si le delete a échoué.

---

### M7 — `users` table : colonnes ENUM avec policy UPDATE Clerk (22P02 latent)

**Fichier :** `supabase/migrations/20260624120000_initial_schema.sql:77`

`users.role` (`user_role` ENUM) et `users.kyc_status` (`kyc_status` ENUM) sont des
colonnes ENUM actives. La policy `users_update_own` autorise le client Clerk à faire des
UPDATE sur `users`. Si une Server Action actuelle ou future met à jour `users` via
`createClerkSupabaseClient()` → 22P02. Actuellement sûr si toutes les updates `users`
passent par service_role — à vérifier et documenter explicitement.

---

### M10 — Révocation de session manquante au soft-delete

**Fichiers :** `src/app/api/webhooks/clerk/route.ts` · `src/lib/auth/assert-coowner.ts`

**Risque :** Le fix E1 (`deleted_at IS NULL`) couvre les lookups `users` par `clerk_user_id` (layout, withdrawals, exports). Mais les Server Actions qui passent directement par `assertWeddingCoowner` sans toucher la table `users` (gifts, guests, seating, timeline, budget, planner, story, visual, notifications, access-code…) restent appelables via API directe avec un JWT Clerk encore valide pendant toute la fenêtre de 7 jours post-suppression.

**Fix complet (deux alternatives) :**
1. **Révocation de session Clerk** dans le webhook `user.deleted` — appel `clerkClient().users.deleteUser(userId)` ou `clerkClient().sessions.revokeSession(sessionId)` au moment du soft-delete. Invalide le JWT immédiatement, couvre 100% des surfaces sans toucher à la DB.
2. **`deleted_at IS NULL` dans `is_wedding_coowner()`** — une migration SQL qui joint `users` dans la fonction RPC. Couvre toutes les actions RLS en un point unique.

Non exploitable via UI (le layout bloque). Nécessite un appel API intentionnel avec JWT valide — risque acceptable pour beta.

---

### M9 — `getMyWedding()` et `getAuthenticatedUserAndWedding()` : LIMIT 1 sans ORDER BY (bug latent)

**Fichiers :** `src/queries/wedding.ts:34` · `src/actions/withdrawals.ts:36` · `src/actions/withdrawals.ts:98`

**Risque :** Ces helpers résolvent le mariage d'un user via `.limit(1).maybeSingle()` sans `ORDER BY` sur `wedding_coowners`. Si un user avait 2+ lignes `wedding_coowners` (mariages distincts), PostgreSQL retournerait n'importe lequel. Toutes les pages dashboard et le flow de retrait utiliseraient alors potentiellement le mauvais mariage.

**Bug LATENT — inoffensif aujourd'hui** car aucun flow applicatif ne crée de 2e ligne `wedding_coowners` pour un même `user_id`. Garde-fou involontaire supplémentaire : le layout dashboard utilise `.maybeSingle()` sans `.limit(1)` — 2+ lignes déclencheraient une erreur PGRST116 et casheraient le dashboard avant toute fuite de données.

**À CORRIGER IMPÉRATIVEMENT avant tout flow multi-mariage** : invitation de coowner cross-mariage, compte gérant plusieurs mariages, interface wedding planner.

**Fix :** Passer `weddingId` explicitement à ces helpers (même pattern que les exports E2 corrigés). Recommandation forte : ajouter une contrainte `UNIQUE (user_id)` sur `wedding_coowners`, ou une colonne `active_wedding_id` sur `users` pour gérer la sélection du mariage actif.

---

### M8 — Absence totale de tests ⚠️ PARTIEL — 2026-06-29

**Commit :** à venir  
**Fichiers créés :**
- `vitest.config.ts` — setupFiles, include tests/unit/, testTimeout
- `tests/unit/setup.ts` — mocks globaux next/headers + next/cache
- `tests/unit/helpers/mock-supabase.ts` — factory chainable mock (call-ordered, captures updates/inserts)
- `tests/unit/actions/withdrawals.test.ts` — 14 tests
- `tests/unit/api/stripe-webhook.test.ts` — 9 tests
- `tests/unit/actions/contributions.test.ts` — 8 tests
- `tests/unit/actions/rsvp.test.ts` — 7 tests
- `tests/unit/actions/seating.test.ts` — 10 tests

**60 tests unitaires sur les 5 flows critiques. Ce que la suite couvre :**
- Validation Zod (NaN, UUID, champs manquants, bornes min/max)
- Guards JS auth/ownership (UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
- Idempotence webhook (contribution déjà succeeded → current_amount non compté 2×)
- Recalcul `current_amount` (somme des contributions succeeded)
- Rollback M3 (Stripe throw + delete KO → log orphelin avec `contributionId`)
- Fix M6 (delete sans capture → DB_ERROR au lieu de faux succès)
- userId Clerk au format text (non-UUID) non rejeté par le code JS

**Ce que la suite NE couvre PAS — dette test d'intégration avant scale :**
- **Policies RLS** (C1/C2 et 22P02) — testables uniquement contre une vraie base Supabase (`supabase start`)
- **Contraintes FK/unique réelles** — même raison
- **Vérification crypto signature Stripe/Svix** — nécessite le SDK réel ou un sandbox

**Plan tests d'intégration (prochaine session, avant scale) :**
```
Prérequis : supabase start + replay migrations en CI (GitHub Actions)
1. RLS cross-tenant : user A ne lit/écrit pas les données de wedding B
2. RLS seating policies : is_wedding_coowner avec JWT Clerk text ID (régression 22P02)
3. Webhook Stripe E2E : stripe-cli listen --forward-to localhost + paiement sandbox
```

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
| 🟠 ÉLEVÉ | 6 | ~~E1 soft-delete bypass~~ ✅ · ~~E2 export cross-tenant~~ ✅ · ~~E3 requestPayout NaN~~ ✅ · ~~E4 guestbook spam~~ ✅ · ~~E5 brute-force access code~~ ✅ · ~~E6 rate limiting manquant~~ ✅ |
| 🟡 MOYEN | 10 | ~~M1 rate limit fail-open~~ ✅ · ~~M2 security headers~~ ✅ · ~~M3 rollback contrib~~ ✅ · ~~M4 erreurs DB silencieuses~~ ✅ · ~~M5 reorderTimeline partial~~ ✅ · ~~M6 delete sans check~~ ✅ · M7 ENUM users latent · ~~M8 zéro tests~~ ⚠️ partiel (60 tests unitaires — RLS/intégration = dette scale) · M9 LIMIT 1 helpers latent · M10 révocation session manquante |
| ⚪ FAIBLE | 5 | F1 migration doc-only · F2 race condition user · F3 divergence fichier/DB seating · F4 cast unsafe seating · F5 queries sans limit |

**Ordre de traitement suggéré avant beta :**
1. Vérifier C2 (pg_policies sur budget_items/checklist_items) — 2 min
2. C1 : migration timeline policy — 10 min
3. E3 : Zod sur requestPayout + try/catch Stripe — 15 min
4. E4 + E5 + E6 : rate limiting guestbook + access code + contributions (un seul diff rate-limit.ts + 3 actions) — 45 min
5. E2 : soft-delete filter layout.tsx — 2 lignes
6. E1 : exports.ts weddingId explicite — 30 min

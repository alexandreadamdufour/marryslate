# État de session — 30 juin 2026

## Fait ce soir

### Bascule prod Marryslate
- Rebrand texte visible complet : `APP_NAME`, metadata, schema.org, labels "Commission Amora", placeholders, footers, i18n — **commit `8c24ec9`**
- CGU + mentions-légales : URLs `amora.fr` → `marryslate.com` + nom de marque dans le texte, correction grammaire `d'Amora` → `de Marryslate`
- `confidentialite/page.tsx` et `cgv/page.tsx` : **hors scope passe 1**, à traiter en passe 2

### Double webhook secret Stripe — commit `01c9437`
- Deux endpoints Stripe pointent sur `/api/webhooks/stripe` : un "Votre compte" (`payment_intent.*`, `charge.refunded`), un "Comptes connectés" (`account.*`, `payout.*`)
- Chaque endpoint a son propre `whsec_` différent
- Fix : boucle qui essaie `STRIPE_WEBHOOK_SECRET` puis `STRIPE_WEBHOOK_SECRET_CONNECT` ; retourne `400` seulement si aucun ne valide
- **Action requise** : ajouter `STRIPE_WEBHOOK_SECRET_CONNECT=whsec_yyyyy` dans Vercel (Settings → Environment Variables)

### Log debug createWedding — commit `01ba5c0`
- Remplacement de `logDbError` (muet en cas d'erreur silencieuse) par `console.error` complet : `code`, `message`, `details`, `hint`, `owner_id`, `slug`
- Log explicite si `weddingError === null` (RLS silent block)

---

## Bugs en cours

### Bug 1 — OAuth Google 404 sur `/inscription/sso-callback`
**Symptôme** : après retour de Google, le navigateur atterrit sur `marryslate.com/inscription/sso-callback` → 404.

**Cause** :
1. `<SignUp>` sans `routing="path"` ni `path="/inscription"` → Clerk construit un callback URL incorrect
2. Aucune route `sso-callback` n'existe dans l'arborescence Next.js
3. Variables d'env `NEXT_PUBLIC_CLERK_SIGN_*` absentes

**Fix validé, diff prêt, NON appliqué** :
- Supprimer `src/app/(auth)/inscription/page.tsx` et `connexion/page.tsx`
- Créer `src/app/(auth)/inscription/[[...sign-up]]/page.tsx` (catch-all optionnel — capture `/inscription`, `/inscription/sso-callback`, `/inscription/verify-email-address`, etc.)
- Créer `src/app/(auth)/connexion/[[...sign-in]]/page.tsx` (idem)
- Ajouter dans Vercel :
  ```
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/connexion
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/inscription
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/etape-1
  ```
- Version installée : `@clerk/nextjs@6.39.5` — convention v6 = catch-all uniquement, pas de `page.tsx` parent (conflit Next.js sinon)

### Bug 2 — `DB_ERROR` à la création de mariage (onboarding étape 3)
**Symptôme** : la Server Action `createWedding` retourne `{"error":"DB_ERROR"}` en prod. Log Vercel jamais lu.

**Hypothèses par ordre de probabilité** :
1. JWT template "supabase" absent ou mal configuré dans Clerk prod → `getToken({ template: "supabase" })` retourne `null` → Supabase reçoit une requête sans auth → RLS bloque avec `42501`
2. `users.id` (UUID) non encore créé au moment de l'insert wedding → contrainte FK `owner_id` → `23503`
3. RLS silent block (weddingError null + wedding null)

**Prochaine action** : reproduire en prod → lire les logs Vercel → chercher `[createWedding] DB insert failed` → coller le résultat ici

---

## Pending beta

| Item | Statut | Notes |
|---|---|---|
| **Test paiement réel end-to-end** | ⏳ non fait | Vérifier `payment_intent.succeeded` → contribution → email reçu + notif couple |
| **JWT template "supabase" sur Clerk prod** | ⚠️ à vérifier | Clerk Dashboard → JWT Templates → template "supabase" doit exister avec claim `{ "role": "authenticated" }` |
| **URL publique `/m/slug`** | ⏳ à tester | Vérifier que `marryslate.com/m/[slug]` résout correctement en prod (ISR, cookie access gate) |
| **Rebrand `confidentialite/page.tsx`** | ⏳ passe 2 | Même mécanique : replace_all "Amora" → "Marryslate" + `d'Amora` → `de Marryslate` + URL |
| **Rebrand `cgv/page.tsx`** | ⏳ passe 2 | Idem + "Frais Amora" → "Frais Marryslate" dans le tableau tarifaire |
| **`STRIPE_WEBHOOK_SECRET_CONNECT`** | ⚠️ action requise | Ajouter dans Vercel env vars avant de tester les payouts/KYC |

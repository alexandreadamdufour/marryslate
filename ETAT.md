# État Marryslate — 1er juillet 2026

## ✅ Résolu — session 30 juin 2026

- **Bascule prod complète** : Stripe live, Clerk prod, domaine marryslate.com, DNS, SSL, CSP, rebrand Amora→Marryslate, double webhook Stripe (commits `8c24ec9`, `01c9437`)
- **OAuth Google** : catch-all Clerk v6 `[[...sign-up]]`/`[[...sign-in]]` + `typedRoutes: false` + 4 env vars `NEXT_PUBLIC_CLERK_*` (commit `6c435ad`). Testé OK.
- **PGRST301** : provider Supabase Third-Party Auth recâblé du domaine Clerk dev vers prod (`clerk.marryslate.com`).
- **42501 createWedding** : cause = policy SELECT owner manquante. Le `.insert().select()` fait un `INSERT...RETURNING`, PostgREST applique les policies SELECT sur la ligne retournée ; `weddings_select_published` (`is_published=false`) et `weddings_select_coowner` (table vide) échouaient → RETURNING refusé. Fix = policy `weddings_select_owner` `USING (owner_id = current_user_id())` (commit `6b41acb`). + fix token Clerk résolu une fois dans `createClerkSupabaseClient` (`ca9744c`). Debug nettoyé (`54fa25f`). Testé OK : "Votre site est prêt !"
- **Rebrand passe 2** : `confidentialite/page.tsx` + `cgv/page.tsx` — plus aucune occurrence "Amora" dans les pages légales (commit `cb42d7e`).
- **Secrets webhook Stripe** : `STRIPE_WEBHOOK_SECRET` et `STRIPE_WEBHOOK_SECRET_CONNECT` confirmés posés dans Vercel Production.

**App fonctionnelle de bout en bout : inscription Google → création de site.**

---

## ✅ Résolu — Sécurité RLS — 1er juillet 2026

- **Faille critique `rls_disabled` sur `rsvp_responses` fermée** : RLS activée + policies `rsvp_responses_insert_public` / `rsvp_responses_select_coowner` + `wedding_id NOT NULL`. Migration `20260625000000` alignée avec l'état prod (table avait été créée à la main sans RLS).
- **Bug de fond `is_wedding_coowner`** : la fonction ne vérifiait que `wedding_coowners`, pas `weddings.owner_id`. Le owner était aveugle sur 26 policies (gifts, contributions, guests, events, budget, checklist, seating, timeline, rsvp_responses…). Corrigée : `owner OR coowner`. Migration `20260701000000`.
- **Guestbook** : policy INSERT `"Public can insert guestbook messages" WITH CHECK (true)` créée à la main en prod contournait l'anti-spam applicatif (rate limiting + Zod). Supprimée. Migration `20260701010000`.
- **`search_path` mutable** : fixé sur `clerk_user_id()`, `set_updated_at()`, `update_gift_current_amount()`. Migration `20260701020000`.
- **`REVOKE EXECUTE FROM PUBLIC`** sur `current_user_id()` + `is_wedding_coowner(uuid)` : le `FROM anon` initial ne marchait pas (le droit venait du grant PUBLIC par défaut). `authenticated` et `service_role` conservent leurs grants explicites. Migration `20260701030000`.
- **Advisor Supabase** : faille critique `rls_disabled` + WARNs `guestbook_insert_public` / `search_path_mutable` / `anon_security_definer` fermés.

---

## ✅ Résolu — RSVP unification incrément 1 (matching) — 1er juillet 2026

- **RSVP unification incrément 1 (matching)** — migration A (`guest_id` + `status` + policy UPDATE, `20260701040000`) appliquée et versionnée ; `submitRsvp` matche par email → `matched`/`pending_validation` + sync `guests.rsvp_status`. Testé en prod : match OK (`matched` + `accepted`) ET non-match OK (`pending_validation`). Insensible à la casse (`citext`), robuste au doublon email (`limit 1`).
- **CLAUDE.md §14 assoupli** : commit direct sur `main` autorisé en solo (à condition d'être atomique, bien nommé, testé avant push). Passage en flux PR dès qu'un contributeur rejoint le projet ou qu'une CI bloquante est en place.

---

## ✅ Résolu — Audit synchro migrations↔prod — 2 juillet 2026

- **Cluster 1 (drift NOT NULL)** : 16 colonnes déclarées `NOT NULL` en migration mais nullables en prod (`budget_items`/`checklist_items`/`seating_tables`/`wedding_timeline`.`wedding_id`, `seating_tables.capacity/position_x/position_y`, `checklist_items.is_completed/priority/created_at`, `rsvp_responses.guest_count/created_at`, `weddings.access_code_enabled/notifications_enabled/rsvp_enabled/is_published`). Audit prod (`SELECT COUNT(*) WHERE ... IS NULL`) : 0 ligne NULL sur 166 lignes confondues → aucun backfill nécessaire. Migration correctrice `20260702000000_fix_drift_not_null.sql` (`SET NOT NULL` direct).
- **Cluster 2 (RPC absent)** : `increment_wedding_view_count` existait dans la migration `20260625080000_view_count.sql` mais n'avait jamais été appliquée en prod. Exécutée manuellement le 2 juillet.
- **Cluster 3 (RouteImpl)** : `/connexion` et `/inscription` sont les racines de catch-all Clerk (`/connexion/[[...sign-in]]`, `/inscription/[[...sign-up]]`), non reconnues littéralement par le typegen de routes Next 16 (indépendant du flag `typedRoutes: false`, devenu un no-op). Fix : constantes `CONNEXION_ROUTE`/`INSCRIPTION_ROUTE` castées `Route` dans `lib/constants.ts`, réutilisées sur les 13 sites concernés.
- **Cluster 4 (guest-form.tsx)** : `guests.side`/`rsvp_status` typés `string | null` côté DB (migration enum→text) → `g?.side ?? "both"` s'élargissait en `string`, cassait l'unification `useForm<FormValues>` + `zodResolver`. Fix : cast littéral `as (typeof WEDDING_SIDES)[number]` (même pattern que `planner-item-form.tsx`).
- **Cluster 5 (tests)** : fixtures `rsvp.test.ts` alignées sur `email` obligatoire (`submitRsvpSchema`, incrément 1 matching).
- `typescript.ignoreBuildErrors` retiré de `next.config.ts`. `pnpm tsc --noEmit` : 68 → 0 erreur.
- `types.ts` régénéré depuis prod (post-migration).

---

## ⏳ Pending (prochaine session)

| Item | Notes |
|---|---|
| **RSVP incrément 2 (conflit) + vue dashboard** | Incrément 2 : détection de conflit (divergence avec la saisie couple + double réponse même email) — à cadrer précisément avant build. PUIS étape dashboard : vue file de validation (`pending_validation`) + vue conflits (`conflict`). Specs dans SPECS-RSVP.md. |
| **Test paiement réel end-to-end** | PRÉREQUIS : vérifier le domaine Resend d'abord (sinon l'email de reçu cassera). Puis : `payment_intent.succeeded` → contribution → email + notif couple. Nécessite couple avec Stripe connecté + KYC validé |
| **Test URL publique `/m/slug`** | ISR, cookie access gate, + chevauchement padding URL `marryslate.com/m/` (cosmétique) |
| **5 couples beta** | Exit Club, Réseau Entreprendre, entourage |
| **Refactor `assertWeddingCoowner`** | Remplacer le `.rpc("is_wedding_coowner")` par un SELECT direct sur `weddings`/`wedding_coowners`. Permet ensuite `REVOKE FROM authenticated` → ferme les 2 WARNs `authenticated_security_definer` restants. Backlog, non bloquant. |
| **Ownership fragile** | `createWedding` fait un 2e INSERT `wedding_coowners` sans error handling (`src/actions/wedding.ts` L109-112). Si cet insert échoue silencieusement, l'owner devient invisible via `getMyWedding()` (pas de fallback `owner_id`). Solutions candidates : (a) transactionnaliser `createWedding`, (b) trigger DB `AFTER INSERT ON weddings`. À cadrer. |
| **Propagation guest_count → guests** | Quand une réponse RSVP à 2/3/4 personnes est rattachée ou crée un guest, le `guest_count` de la réponse est perdu côté liste maître (`guests` n'a que `plus_one` booléen + `plus_one_name`). À trancher avec les 5 beta : (a) ajouter colonne `guest_count` à guests, (b) auto-set `plus_one=true` si >1, (c) créer N guests séparés. Non bloquant tant que Nb reste visible dans "Réponses traitées". |
| **Tests unitaires bloqués par env.ts** | `tests/unit/actions/rsvp.test.ts` et `tests/unit/api/stripe-webhook.test.ts` échouent à l'import car Vitest ne charge pas `.env.local`. Fix : soit `envDir` dans `vitest.config.ts`, soit mock de `@/lib/env` dans `tests/unit/setup.ts`. 30 min. Non bloquant tant que la CI n'exige pas ces suites. |
| **Résolution conflit multi-réponses (3+)** | Si un email a 3+ réponses divergentes, resolveRsvpConflict traite chaque réponse indépendamment (last-write-wins sur guests.rsvp_status). Cas rare, non prioritaire, à réévaluer avec les 5 beta. |
| **Race condition detectConflict (TOCTOU)** | detectConflict fait SELECT puis INSERT sans transaction/verrou. Deux réponses concurrentes au même email peuvent s'insérer sans se flaguer mutuellement. Mitigation propre = pg_advisory_xact_lock ou RPC SECURITY DEFINER. Probabilité très faible, à durcir si cas réel remonte. |
| **RESEND_API_KEY placeholder résiduel (leçon)** | La clé Resend en prod était `re_aBcDe...` (placeholder de doc jamais remplacé) depuis le 24 juin. Aucun email n'était envoyé — les `.catch()` silencieux dans les Server Actions masquaient l'erreur 401. Résolu le 1er juillet en cours de session. Discipline à retenir : auditer les placeholders documentaires (`re_aBcDe`, `sk_live_xxx`, etc.) au setup initial de chaque service, ne jamais commit avec la valeur d'exemple. |
| **Return_url Stripe Connect à revérifier** | Le fix `env.NEXT_PUBLIC_APP_URL` + variable Vercel Production corrigés le 1er juillet devrait avoir résolu le bug `amora.vercel.app` sur Connect aussi (`setupStripeConnect` utilise déjà `env.NEXT_PUBLIC_APP_URL` correctement). À revalider empiriquement lors du prochain onboarding Stripe Connect (couple beta) : si l'onboarding se termine bien sur `marryslate.com/dashboard/retrait?onboarding=complete` = OK. Sinon, redébugger. |
| **Section galerie site public à créer** | Découvert lors de l'intégration des photos démo "alexetlouise" : aucune vraie feature galerie n'existe (pas de colonne, pas de composant, pas d'action upload dédiée). `weddings.story_images` a été détourné comme galerie temporaire (composant `WeddingStory` supporte déjà l'affichage de 4+ images en masonry) — fonctionne visuellement mais mélange "Notre histoire" et photos de lieu sous le même bloc. À terme : vraie section galerie (colonne/table dédiée, composant, upload action, section distincte sur le site public). |
| **`uploadCoverImage` manquant** | Découvert lors du même chantier photos démo : `updateWeddingSchema` accepte `coverImageUrl` en string mais aucune UI/action dashboard ne permet à un couple de fixer sa photo hero — contrairement à `uploadGiftImage`/`uploadStoryImage` qui existent. L'item checklist onboarding "Ajouter votre photo de couple" pointe vers `/dashboard/site` en supposant ce flow ; à construire (même pattern que `uploadStoryImage`, bucket `gift-images`). |

## 🛋️ Confort UX (post-beta)

- **Empty states** : première visite de chaque page dashboard rend un placeholder générique. À travailler pour meilleure UX onboarding.
- **Toasts unifiés** : notifications de succès/erreur sont bricolées par composant (sonner, alert, state local). Uniformiser via sonner.
- **Responsive mobile audit** : jamais testé systématiquement sur mobile. 50% des couples beta ouvriront sur téléphone.
- **Onboarding première connexion** : rugueux, un nouveau couple ne comprend pas immédiatement comment activer chaque feature (cagnotte cachée si pas de cadeau, RSVP toggle à activer, etc.).

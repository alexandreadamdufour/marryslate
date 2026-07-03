# État Marryslate — 3 juillet 2026 (suite)

> Dernier commit : `d397a2e` — perf: preconnect Sentry ingest (gain LCP estime 300ms)
> Ce fichier est la source de vérité sur l'avancement. À remettre à jour à la fin de chaque session (voir CLAUDE.md §17).

---

## État prod (marryslate.com)

- **Live et fonctionnel** : inscription Google → onboarding → création de site → RSVP → cagnotte/liste de cadeaux → retrait. Vérifié en direct (HTTP 200 sur `/` et `/m/alexetlouise`) le 3 juillet.
- Monitoring Sentry actif, GA4 + Google Search Console vérifiés, CSP durcie avec reporting, rate limiting (Upstash) sur tous les endpoints publics.
- Hooks pre-commit/commit-msg (Husky + commitlint) actifs sur le repo.

**Avancement estimé** (qualitatif, pas de métrique formelle) :

| Axe | % | Ce qui manque |
|---|---|---|
| **Beta technique** | ~90% | Test paiement réel end-to-end jamais fait, 5 couples beta pas encore onboardés |
| **UI** | ~85% | Hero + features homepage refaits récemment ; dashboard jamais audité mobile de façon systématique |
| **UX** | ~70% | Onboarding "rugueux" (confort UX), propagation `guest_count`/conflits RSVP à trancher avec de vrais retours |
| **Produit complet (légal inclus)** | ~50% | Bloqué par le volet Legal/Compliance — rien engagé à ce jour |

---

## Historique (résolu avant le 2 juillet)

- **Bascule prod complète** : Stripe live, Clerk prod, domaine marryslate.com, DNS, SSL, CSP, rebrand Amora→Marryslate, double webhook Stripe (30 juin, commits `8c24ec9`, `01c9437`)
- **Sécurité RLS (5 fixes)** : faille critique `rls_disabled` sur `rsvp_responses` fermée ; bug de fond `is_wedding_coowner` (owner aveugle sur 26 policies, corrigé owner OR coowner) ; policy guestbook `WITH CHECK (true)` créée à la main en prod supprimée ; `search_path` mutable fixé ; `REVOKE EXECUTE FROM PUBLIC` sur les fonctions SECURITY DEFINER (1er juillet)
- **RSVP unification incrément 1 (matching)** : `submitRsvp` matche par email → `matched`/`pending_validation` + sync `guests.rsvp_status`, testé en prod (1er juillet)
- **Audit synchro migrations↔prod** : 5 clusters de drift corrigés (16 colonnes NOT NULL, RPC jamais appliqué, routes catch-all Clerk, typage guest-form, fixtures tests) ; `pnpm tsc --noEmit` 68 → 0 erreur ; `types.ts` régénéré (2 juillet)
- **`uploadCoverImage`** : gap bloquant beta fermé — action + `CoverImageUploader` intégrés à `/dashboard/site` (2 juillet)

---

## Réalisé depuis le 2 juillet (chronologique, groupé par chantier)

### Polish grand public (4 axes)
- A11y : skip link + `aria-hidden` sur icônes décoratives (`6bb550f`)
- Hover states cards/KPI/tabs dashboard (`f9c8fa8`)
- Loading skeletons dédiés : invites, contributions, site, plan-de-table (`ceb39ff`)
- Micro-animations toasts + audit typo/spacing final (`c56bdd3`)

### Photos utilisateurs — upload complet
- Install `react-easy-crop`, `react-dropzone`, `p-limit` (`ffdee30`)
- Composants réutilisables `ImageDropzone` + `ImageCropper` (`33e8094`)
- Hero : drag-drop + cropper 3:2 **forcé** (`0faf4cc`)
- Gift : drag-drop + cropper 4:3 **conseillé** (skip possible) (`769e049`)
- Story : drag-drop multiple + upload à concurrence bornée (`87c1e17`)

### Analytics — GA4 pageview
- Tracking pageview SPA explicite (`8cf442c`)
- Découverte : GA4 + GSC étaient **déjà live** en prod, jamais documenté (`94eaf09`)

### Monitoring Sentry
- Install + config (`instrumentation-client`, server, edge, `onRequestError`) (`bdecbdf`, `e183c2a`)
- Env `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN`, fix slug projet (`775617a`, `7de7a31`)
- Page de test posée puis retirée après validation (`b2709f8`, `c9430f7`)

### Accommodations & affiliation Booking
- Extension schéma hébergements (distance, plafond 8) (`dbee56e`)
- Section publique dédiée "Où dormir" (`fc782e9`)
- Utilitaire `withBookingAffiliate`, injection au render (`303107a`)

### Triage Semgrep
- Bump deps dev (vitest → 3.2.6, **pas** 4.x — casse le peer `vite`, testé et écarté) (`d6c902c`)
- Échappement JSON-LD + whitelist slug blog (`e9a5144`)

### Session sécurité + business
- Gestion `RATE_LIMITED` côté client contribution (parité RSVP/guestbook) (`c6e16ae`)
- CSP durcie : `frame-ancestors`, `upgrade-insecure-requests`, `report-uri` Sentry (`22bafb1`)
- Policy RLS `guests_select_owner` (défense en profondeur, ownership fragile) (`bbb1887`)
- 5 events funnel GA4 : `sign_up`, `first_gift_created`, `first_contribution_received`, `first_withdrawal_initiated`, `share_link_copied` (`1f89e74`)
- Section Legal/Compliance ajoutée à ce fichier (`cba1a0e`)

### OG images dynamiques
- `/m/[slug]/opengraph-image` (photo + prénoms + date) (`b24e2c6`)
- Homepage marketing (`04aa248`)

### Pixels publicitaires
- Meta Pixel client + event `Purchase` serveur (Conversions API) (`d944aa0`)
- Google Ads Conversion (optionnel) (`113761a`)

### Husky / commitlint
- Install + `husky init` (`e3ddb84`)
- Hooks pre-commit/commit-msg + convention documentée dans CLAUDE.md (`01bd6ff`)

### SEO
- 2e balise `google-site-verification` (propriété URL-prefix) (`0e3ff43`)

### Lighthouse — perf & accessibilité
- Contraste `muted-foreground` (variables CSS globales) (`1211823`)
- `lazyOnload` sur Meta Pixel/Crisp/GA4, Sentry gardé `afterInteractive` (`60a485d`)
- Fraunces self-hosted via `next/font/local` (`5eadb2e`)

### Refonte hero homepage
- Split gauche/droite + mockup animé (`50c6ab8`)
- Fix padding top (`9ed7f3a`)

### Bento Grid features homepage
- Refonte section features en grille 6 colonnes asymétrique, 5 blocs (`7734273`)
- Site personnalisé (phare, cover réelle + nav factice), Cagnotte (vraies photos gifts + progression), RSVP (badges shadcn), Plan de table (table ronde vue de dessus + drag-preview), Livre d'or
- Aucune migration DB, contenu figé dans le composant
- Vérifié en dev local (navigateur, desktop) ; comportement mobile vérifié par lecture de code (classes `lg:`), pas testé visuellement ni en prod

### Hygiène perf/sécu (Bloc 1, 4 items)
- Image bloc phare Bento : `sizes` next/image ajusté sur les breakpoints réels (814px entre lg et 2xl, 987px au-delà) au lieu de `66vw` — évite l'upscale sur écrans ≥2xl tout en corrigeant le sur-dimensionnement signalé par Lighthouse (~20 Kio) (`b2096c6`)
- `browserslist` ajouté à `package.json` (cible navigateurs modernes ES6-module, exclut IE11) — coupe les polyfills legacy inutiles générés par défaut (~15 Kio Lighthouse) (`280d2ff`)
- Header `Cross-Origin-Opener-Policy: same-origin-allow-popups` ajouté — vérifié sans impact sur Clerk (OAuth Google en redirect plein-page, pas de popup) ni Stripe Connect (`window.location.href`, pas de popup) ; `-allow-popups` retenu plutôt que strict pour ne pas casser silencieusement une future intégration OAuth en popup (`7814597`)
- Source maps Sentry en prod : vérifiées déjà correctes (`authToken` lu depuis `SENTRY_AUTH_TOKEN`, upload actif par défaut, `hideSourceMaps` absent = comportement par défaut sécurisé — maps uploadées à Sentry puis retirées du bundle public). Aucun fix nécessaire, item skippé.

### Bloc 2 — Audit mobile dashboard + Lighthouse mobile marketing (fermé, bilan mesuré)
- Audit Lighthouse mobile réel + audit code mobile dashboard (6 agents parallèles), plan d'action 6 fixes priorisés
- `fetchPriority="high"` sur l'image hero marketing — `priority` seul ne suffit pas en Next 16.2.9 pour poser `fetchpriority` sur le `<img>` (vérifié dans le code source du package + le HTML servi) (`50f5371`)
- Pattern `pointer-coarse` (déjà présent dans `seating-table-node.tsx`) généralisé aux actions/drag masqués au tactile : `planner-editor.tsx` (bloquant réel — actions inaccessibles), `gift-card.tsx`, `wedding-events-editor.tsx`, `timeline-editor.tsx` (`9b64bae`)
- `SeatingEditor` (plan de table) chargé via `dynamic(ssr:false)` gated par `matchMedia` — ne s'importe plus du tout sur mobile au lieu d'être monté puis masqué en CSS (`d557203`)
- Dialog cropper : hauteur bornée `max-h-[90vh] overflow-y-auto` (évite bouton coupé sur petit écran clavier ouvert) (`f07adaa`)
- Sweep hitbox tactile 44px sur 21 boutons/10 fichiers (actions destructives adjacentes priorisées : `guest-editor`, `gift-card`, `budget-editor`, `timeline-editor`, `wedding-events-editor`, `planner-editor`, `practical-info-form`, `story-form`, `contribution-form`, burger nav `sidebar.tsx`) (`ffae006`)
- **`ClerkProvider` scopé à `(auth)` et `(dashboard)` uniquement** (retiré du layout racine) : cartographie exhaustive préalable (aucun hook client Clerk hors de ces 2 groupes, `/onboarding` traité pareil que marketing), Angle A retenu (2 instances séparées) vs Angle B (layout partagé) après comparaison des risques de remount. Testé en réel : sign-in Google → dashboard, pas de flash, `UserButton` immédiat (`c131e0e`)
- Fix `afterSignOutUrl` deprecated sur `UserButton`, remonté au niveau `ClerkProvider` (`a7d9ee2`)
- Lazy-load Sentry Replay via package standalone `@sentry/replay` (pas `@sentry/nextjs`, déjà importé statiquement — un `import()` du même spécificateur ne scinde pas le chunk chez Turbopack, vérifié empiriquement en comparant deux tentatives) — chunk Replay confirmé hors `rootMainFiles`, priorité réseau "Low" (`6522d10`)
- Préconnect Sentry ingest dans le `<head>` du layout racine (`d397a2e`)
- **Bilan mesuré** (PageSpeed/Lighthouse, machine sous charge variable — mesures mobiles bruitées, desktop fiable) : **desktop ~99** (quasi parfait), **mobile ~72-75**. 0 chunk Clerk sur homepage/site public confirmé sur tous les runs. Objectif ≥90 mobile non atteint — voir Bloc 2bis ci-dessous.

### Bloc 2bis-A — LCP mobile 7.8s (fermé, bilan mesuré)
- Diagnostic (Serena + inspection HTML/réseau réel) : root layout déclarait 6 familles de polices (dont 5 de thème mariage, utilisées seulement par `(dashboard)` et le site public) — préchargées en priorité haute sur **toutes** les routes, y compris la homepage. Animation `animate-fade-in-scale` (opacity 0→1, delay 0.2s) sur le wrapper de l'image hero retardait en plus sa reconnaissance LCP par Chrome.
- Fix : polices de thème extraites vers `src/lib/fonts.ts`, appliquées seulement où consommées (`(dashboard)` layout + nouveau `(public-wedding)/layout.tsx`) ; root layout ne garde qu'Inter + Fraunces. Animation retirée du wrapper de l'image hero (`priority` + `fetchPriority="high"` déjà un signal explicite, contradictoire avec une entrée animée) (`542d347`, précédé d'un fix lint isolé sans rapport `7d30fd5`)
- **Bilan mesuré** (Lighthouse mobile, 2 runs, prod) : LCP **7.8s → ~3.2s médiane (-59%)**.
- Deux pistes complémentaires testées et écartées (impasses documentées, pas de code résiduel) :
  - **Recompression de l'image source** (294 KB JPEG brut) : le dérivé réellement livré au mobile est déjà 40 KB AVIF via `next/image` (`q=75`, `sizes` correct) — confirmé par inspection du HTML servi + test direct de la variante mobile. Gain marginal à nul attendu, Next re-quantifie systématiquement à q75 quel que soit le poids source.
  - **Inter en police variable (50 KB)** : testé empiriquement (`weight: ["400","500","600","700"]` + build local + inspection du CSS généré). Aucun gain — Google Fonts ne sert Inter que sous forme de fichier variable, les 4 graisses déclarées pointent vers le **même fichier physique** (dédupliqué par le navigateur de toute façon). Changement reverté, aucun commit.
- Objectif <2.5s (budget CLAUDE.md §10) non atteint à ce stade — facteur limitant restant identifié : contention réseau/main-thread avec les scripts tiers (voir Bloc 2bis-B).

---

## Pending — Bloc 2bis (perf mobile, non bloquant beta)

| Item | Notes |
|---|---|
| **2bis-B — Scripts tiers (GTM/Crisp/Meta Pixel/Sentry), LCP <2.5s** | En cours. Diagnostic : GTM, Crisp, Meta Pixel déjà en `strategy="lazyOnload"` (rien à faire). Le chunk 130 Kio priorité Low identifié dans le waterfall (tirait au même instant que l'image hero) est en réalité le SDK **Sentry** (`instrumentation-client.ts`, import statique de `@sentry/nextjs`), pas un des 3 scripts nommés. |
| **Chunk vendor `06tfw...` — 60 Kio inutilisés** | Identifié via bundle analyzer (webpack forcé, Turbopack incompatible avec `@next/bundle-analyzer` — nécessite `next build --webpack` pour générer le rapport). Composition exacte non identifiée à date (zod + probablement d'autres deps mêlées par le chunk-splitting automatique). À creuser. |
| **CSS critique 18 Kio bloquant ~320ms** | Render-blocking CSS repéré par Lighthouse (`render-blocking-insight`), pas encore traité (candidat : inline critical CSS ou split). |
| **Préconnect Sentry (`d397a2e`) marqué "inutilisé" par PageSpeed** | À réévaluer plus tard — potentiellement à retirer si le gain ne se confirme pas en usage réel. |

---

## Pending — Bloquant beta (5 couples)

| Item | Notes |
|---|---|
| **Test paiement réel end-to-end** | Prérequis : vérifier domaine Resend (sinon email de reçu cassé). Puis `payment_intent.succeeded` → contribution → email + notif couple. Nécessite couple Stripe connecté + KYC validé. Jamais fait. |
| **Onboarding des 5 couples beta** | Exit Club, Réseau Entreprendre, entourage. Pas démarré. |
| **Ownership fragile `createWedding`** | 2e `INSERT wedding_coowners` sans error handling (`src/actions/wedding.ts` L109-112) — si échec silencieux, owner invisible via `getMyWedding()`. Solutions candidates : (a) transactionnaliser, (b) trigger DB `AFTER INSERT`. À cadrer. |

---

## Pending — Bloquant paiement réel / légal

| Item | Notes |
|---|---|
| **Agrément IFP/ORIAS (ACPR)** | Marryslate encaisse/reverse des fonds tiers — statut potentiel IFP ou établissement de paiement selon montage Stripe Connect. Probablement obligatoire avant lancement grand public. 6-12 mois, 5-10k€. **À initier tôt vu les délais.** Rien engagé. |
| **RGPD (registre + DPA)** | DPA à collecter/signer avec Supabase, Clerk, Stripe, Resend, Sentry. Aucun confirmé signé. |
| **CGV/CGU spécifiques cagnotte-mariage** | Cabinet spécialisé (Lexing, Alan Walter, ou équivalent). 800-1500€ HT, ~2 semaines. Les CGU/CGV actuelles sont génériques. |

---

## Pending — UX à trancher avec retours beta

| Item | Notes |
|---|---|
| **RSVP incrément 2 (conflit) + vue dashboard** | Détection de conflit (divergence saisie couple + double réponse même email) à cadrer avant build. Puis vue file de validation (`pending_validation`) + vue conflits (`conflict`). Specs dans SPECS-RSVP.md. |
| **Propagation `guest_count` → `guests`** | RSVP à 2/3/4 personnes : `guest_count` perdu côté liste maître (`guests` n'a que `plus_one` bool + `plus_one_name`). Options : (a) colonne `guest_count` sur `guests`, (b) auto `plus_one=true` si >1, (c) N guests séparés. Non bloquant tant que visible dans "Réponses traitées". |
| **Résolution conflit multi-réponses (3+)** | `resolveRsvpConflict` traite chaque réponse indépendamment (last-write-wins). Cas rare, non prioritaire. |
| **Onboarding première connexion** | Rugueux : un nouveau couple ne comprend pas immédiatement comment activer chaque feature (cagnotte cachée si pas de cadeau, RSVP à activer, etc.). |

---

## Dette technique / cosmétique non urgente

| Item | Notes |
|---|---|
| **Test URL publique `/m/slug`** | ISR, cookie access gate, + chevauchement padding URL `marryslate.com/m/` (cosmétique). Jamais testé systématiquement. |
| **Return_url Stripe Connect** | Fix `env.NEXT_PUBLIC_APP_URL` du 1er juillet devrait avoir résolu le bug `.vercel.app`, jamais revalidé empiriquement depuis. À confirmer au prochain onboarding Stripe Connect beta. |
| **Section galerie site public** | Pas de vraie feature — `story_images` détourné comme galerie temporaire (fonctionne visuellement, mélange "Notre histoire" et photos de lieu). |
| **Refactor `assertWeddingCoowner`** | Remplacer `.rpc("is_wedding_coowner")` par un SELECT direct. Fermerait les 2 derniers WARNs Supabase Advisor (`authenticated_security_definer`). |
| **Tests Vitest bloqués par `env.ts`** | `rsvp.test.ts` et `stripe-webhook.test.ts` échouent à l'import (Vitest ne charge pas `.env.local`). Fix ~30 min (`envDir` ou mock `@/lib/env`). Non bloquant. |
| **Race condition `detectConflict` (TOCTOU)** | SELECT puis INSERT sans transaction/verrou — deux réponses concurrentes au même email peuvent ne pas se flaguer mutuellement. Probabilité très faible. |
| **Lint `seating-table-node.tsx`** | `'X' is defined but never used`, présent depuis plusieurs sessions, ne bloque rien. |
| **Vestiges MangoPay** | 4 clés `MANGOPAY_*` orphelines dans `.env.local` (absentes de `.env.local.example`) + colonne DB `contributions.mangopay_payment_id` (nullable, jamais lue). Code applicatif déjà retiré (`d3c3238`). Aucun risque, nettoyage cosmétique un jour. |
| **Bug UI onboarding étape 3 — placeholder slug** | Le placeholder du champ slug (ex. `sophie-et-thomas`) se superpose au préfixe fixe `marryslate.com/m/` — problème de padding/positionnement CSS de l'input. Repéré le 3 juillet lors du test de validation du trigger ownership. Fichier probable : `src/app/onboarding/etape-3/` ou composant slug input. |
| **4 lignes `contributions` du 1er juillet en `succeeded`** | Alors que refunded côté Stripe — webhook `charge.refunded` n'était pas souscrit à l'époque, l'endpoint a été corrigé depuis (3 juillet). Nettoyage manuel possible en DB si un jour la compta le nécessite. |
| **Leçon — `RESEND_API_KEY` placeholder résiduel** | La clé Resend en prod était `re_aBcDe...` (placeholder de doc jamais remplacé) depuis le 24 juin. Aucun email n'était envoyé — les `.catch()` silencieux dans les Server Actions masquaient l'erreur 401. Résolu le 1er juillet. **Discipline à retenir** : auditer les placeholders documentaires (`re_aBcDe`, `sk_live_xxx`, etc.) au setup initial de chaque service, ne jamais commit avec la valeur d'exemple. |

---

## Dépendances gelées volontairement

- **`tailwindcss` v3** (v4 dispo) — gelé tant que shadcn/ui n'est pas migré (CLAUDE.md §1)
- **`vitest` v3.2.6** (v4 dispo) — v4 casse le peer `vite` (testé et écarté, cf. triage Semgrep)
- **`zod` v3** (v4 dispo) — épinglé par CLAUDE.md §1
- Autres majeures disponibles non prises, sans urgence : `typescript` 6, `@supabase/ssr` 0.12, `lucide-react` 1.x, `sonner` 2, `tailwind-merge` 3, `eslint-config-next` 16

---

## Env manquantes en local (pour mémoire)

9 clés optionnelles absentes de `.env.local` (no-op confirmé si absentes, Vercel Production les a) : `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `GA_MEASUREMENT_PROTOCOL_API_SECRET`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`, `NEXT_PUBLIC_BOOKING_AID`, `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`.

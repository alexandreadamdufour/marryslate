# Events GA4 — funnel de conversion

Au-delà des pageviews automatiques (`GoogleAnalyticsPageview`), 5 events custom trackent le vrai funnel : inscription → premier cadeau → première contribution → premier retrait, plus un signal de partage.

| Event | Déclencheur | Fichier | Implémentation |
|---|---|---|---|
| `sign_up` | Fin du wizard onboarding (wedding créé, atteinte de `/onboarding/etape-4`) | `src/components/dashboard/onboarding-complete-tracker.tsx` | `sendGAEvent`, client |
| `first_gift_created` | Premier cadeau créé (`gifts.length === 0` avant l'ajout) | `src/components/dashboard/gift-list-editor.tsx` | `sendGAEvent`, client |
| `first_contribution_received` | Première contribution `succeeded` pour le wedding | `src/app/api/webhooks/stripe/route.ts` | `sendGA4ServerEvent` (Measurement Protocol), **serveur** |
| `first_withdrawal_initiated` | Premier retrait demandé (`withdrawals.length === 0` au chargement de la page) | `src/components/dashboard/payout-setup.tsx` | `sendGAEvent`, client |
| `share_link_copied` | Bouton "Partager votre lien" cliqué (checklist onboarding) | `src/components/dashboard/onboarding-checklist.tsx` | `sendGAEvent`, client — `params: { source: "onboarding_checklist" }` |

## Pourquoi `first_contribution_received` est côté serveur, pas client

Les 4 autres events utilisent `sendGAEvent` (`@next/third-parties/google`), qui pousse dans le `dataLayer` du navigateur — nécessite un contexte client. Impossible depuis un webhook Stripe (aucun `window`).

Deux options considérées :
- **Page `/m/[slug]/contribuer/success`** (client, plus simple) — écartée : le redirect Stripe vers cette page peut arriver **avant** que le webhook `payment_intent.succeeded` ait tourné (race condition côté Stripe, pas garanti dans l'ordre). Un count de contributions à ce moment-là serait peu fiable pour déterminer "est-ce la première".
- **Webhook Stripe** (serveur, choisi) — le count `succeeded` se fait juste après l'`UPDATE` qui marque cette contribution comme réussie, donc authoritative et séquentiel.

Ça impose `sendGA4ServerEvent` (`src/lib/ga4-server-event.ts`), qui appelle directement l'API **GA4 Measurement Protocol** (`POST https://www.google-analytics.com/mp/collect`) plutôt que `sendGAEvent`. Différences à connaître :

- Nécessite un **nouveau secret** : `GA_MEASUREMENT_PROTOCOL_API_SECRET` (généré dans GA4 Admin → Data Streams → flux web → Measurement Protocol API secrets). Contrairement au DSN Sentry ou à l'AID Booking, **c'est un vrai secret** — quiconque le possède peut injecter des events arbitraires dans la propriété GA4. Jamais `NEXT_PUBLIC_`.
- `client_id` généré aléatoirement à chaque appel (`crypto.randomUUID()`) : pas de session utilisateur à rattacher côté serveur. L'event remonte bien dans les rapports GA4 (comptage funnel correct) mais **ne se fusionne pas** avec le parcours de navigation du visiteur (acquisition channel, session d'origine, etc. non attribués).
- No-op silencieux si `NEXT_PUBLIC_GA_ID` ou `GA_MEASUREMENT_PROTOCOL_API_SECRET` absent — ne bloque jamais le traitement du webhook (erreurs réseau catchées, jamais throw).

## Ajouter un nouvel event

Client (Server/Client Component avec accès navigateur) : `sendGAEvent("event", "nom_event", { params })` depuis `@next/third-parties/google`.

Serveur (webhook, cron, Server Action sans contexte navigateur) : `sendGA4ServerEvent("nom_event", { params })` depuis `@/lib/ga4-server-event`.

## Meta Pixel + Conversions API (CAPI)

`src/components/shared/meta-pixel.tsx` — snippet standard Meta Pixel (`next/script`, pas de support `@next/third-parties` pour Meta). Injecté dans `layout.tsx` sous sa propre gate `NEXT_PUBLIC_META_PIXEL_ID`, indépendante de GA4. Fire `PageView` automatiquement au chargement de chaque page.

**Event serveur `Purchase`** : `src/lib/meta-capi-event.ts` (`sendMetaCapiEvent`), calqué sur `sendGA4ServerEvent` — même limitation (pas d'IP/user-agent du visiteur d'origine disponible dans un webhook server-to-server, match quality réduite). Câblé dans le webhook Stripe (`payment_intent.succeeded`), juste à côté de `first_contribution_received`.

Différence de sémantique importante avec GA4 : `Purchase` fire sur **chaque** contribution réussie, pas seulement la première. `first_contribution_received` (GA4) est un jalon de funnel (one-shot) ; `Purchase` (Meta/Ads) sert à l'optimisation publicitaire (ROAS) et doit refléter toute conversion. Valeur envoyée : `gross_amount` (montant payé par l'invité), pas `net_amount` (après frais Stripe/plateforme) — c'est ce que les plateformes pub utilisent pour évaluer la valeur perçue.

Nécessite `META_CAPI_ACCESS_TOKEN` (Events Manager → Conversions API → Generate Access Token) — **vrai secret**, contrairement au Pixel ID, jamais `NEXT_PUBLIC_`. No-op silencieux si `NEXT_PUBLIC_META_PIXEL_ID` ou `META_CAPI_ACCESS_TOKEN` absent.

CSP (`next.config.ts`) : `connect.facebook.net` (script-src), `www.facebook.com` (connect-src + img-src, pixel de fallback `<noscript>`).

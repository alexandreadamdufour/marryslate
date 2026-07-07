# Lot 1 — Boucle virale invités (design condensé)

> Contexte : sprint acquisition/rétention pré-planification automne. Chaque mariage expose 80-150 invités dont 2-5 futurs mariés — canal d'acquisition gratuit. Lot 1 = priorité absolue, jamais sacrifié.

## État constaté (avant conception)

- Pas de route RSVP dédiée : section inline `src/components/wedding-site/wedding-rsvp-section.tsx` (`"use client"`), `Dialog` à 3 étapes (`idle`/`form`/`done`). L'étape `"done"` est un message statique dans la même modale, pas un écran séparé.
- `src/app/(public-wedding)/layout.tsx` est minimal, sans footer partagé. Les tokens de thème (couleurs HSL, police) sont appliqués via un `<div className={themeClass} style={weddingStyle}>` au niveau de **chaque page**, pas du layout (`page.tsx`, `contribuer/page.tsx`, `contribuer/success/page.tsx`).
- 2 thèmes existent déjà (`classic`, `contemporary`) — `WEDDING_THEMES` dans `src/lib/constants.ts`, tokens CSS dans `globals.css` (`.theme-classic`, `.theme-contemporary`).
- `src/components/wedding-site/wedding-countdown.tsx` existe et est réutilisable telle quelle.
- Pages marketing existantes suivent un pattern homogène (`src/app/(marketing)/tarifs/page.tsx` : `Metadata` export, sections, CTA vers `INSCRIPTION_ROUTE`).
- GA4 : `sendGAEvent` (client, `src/lib/ga-client-event.ts`) et `sendGA4ServerEvent` (serveur). `sign_up` part déjà de `src/components/dashboard/onboarding-complete-tracker.tsx`.
- Validation RSVP : `src/lib/validators/rsvp.ts` (`submitRsvpSchema`) + `src/actions/rsvp.ts` (`submitRsvp`).

## Design

### 1. Audit RSVP mobile-first
Passe ciblée sur `wedding-rsvp-section.tsx` à 375px, sans changement de logique métier :
- Types d'input adaptés : `type="email"`, `type="tel"` (si champ tel existe), `inputMode="numeric"` sur le nombre d'invités.
- Tap targets ≥44px sur tous les contrôles interactifs de la modale (pattern déjà établi ailleurs dans le repo, cf. Bloc 2 mobile).
- Vérifier l'absence de layout shift à l'ouverture/fermeture du `Dialog` et entre les étapes `idle → form → done`.

### 2. Écran post-RSVP repensé
L'étape `"done"` reste **dans la même modale** (pas de redirection plein écran — cohérent avec le pattern existant, moins risqué). Contenu enrichi :
- Prénom de l'invité (déjà collecté dans le form).
- Récap de la réponse : présent/absent + nombre d'invités.
- `<WeddingCountdown>` réutilisé tel quel (date du mariage).
- Bloc visuellement distinct (séparateur, ton complice) : "Vous organisez un mariage ?" → CTA vers `/pour-les-maries?utm_source=rsvp`.

### 3. Footer signature
Nouveau composant `src/components/wedding-site/site-footer-signature.tsx` : "Créé avec ♥ sur Marryslate", cliquable vers la homepage marketing, sobre, hérite des CSS vars de thème ambiantes (pas de props couleur explicites — le thème est déjà posé par le `<div>` parent).
Inséré à l'intérieur du `<div>` themé de 3 pages : `m/[slug]/page.tsx`, `m/[slug]/contribuer/page.tsx`, `m/[slug]/contribuer/success/page.tsx`. Pas dans `layout.tsx` (hors du wrapper thémé).

### 4. Landing `/pour-les-maries`
Nouvelle page `src/app/(marketing)/pour-les-maries/page.tsx`, structure calquée sur `tarifs/page.tsx` :
- Hero émotionnel, 3 blocs bénéfices, captures produit (réutiliser les visuels déjà présents dans le bento grid homepage si pertinent, sinon composants illustratifs simples — pas de nouvelles images à faire designer).
- CTA vers `INSCRIPTION_ROUTE`.
- `Metadata` OG dédiée (titre, description, image OG — réutiliser le pattern `opengraph-image.tsx` existant si temps permet, sinon OG statique via `Metadata`).

### 5. Tracking GA4
- `cta_maries_clicked` (client, `sendGAEvent`) sur les 2 CTA : bloc post-RSVP et CTA(s) de la landing, avec un paramètre `location` (`"rsvp_confirmation"` / `"landing_hero"` etc.).
- Pas de nouvel event `landing_maries_signup` distinct : au montage de la landing, si `utm_source=rsvp` est présent, on le persiste en `sessionStorage` (pattern déjà utilisé dans l'onboarding) ; `onboarding-complete-tracker.tsx` lit cette valeur et l'ajoute en paramètre `referral_source` à l'event `sign_up` existant si présente. Pas de tracking cross-session complexe.

## Hors scope Lot 1
- Pas de nouveau thème (Lot 3).
- Pas de refonte du système de theming (footer s'adapte au thème existant, ne le modifie pas).
- Pas de route RSVP dédiée à créer — le flux modal inline est conservé tel quel.

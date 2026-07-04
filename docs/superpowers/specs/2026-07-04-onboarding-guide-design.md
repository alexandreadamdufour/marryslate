# Bloc 3 — Chantier 1 : Onboarding guidé première connexion

> Spec 1/4 du Bloc 3 (UX/conversion). Ordre d'exécution : 1 (ce document) > 2 (empty states) > 3 (FAQ homepage) > 4 (compteur social proof). Chaque chantier est designé, planifié, implémenté et validé avant de passer au suivant.

## Contexte

Demande initiale : à la première connexion au dashboard après création du wedding, le couple doit voir un flow guidé "Bienvenue → choisis ton thème → premières infos essentielles → invite tes premiers proches" plutôt qu'un dashboard vide.

État des lieux (vérifié dans le code avant design) :
- Un wizard pré-dashboard existe déjà : `/onboarding/etape-1` à `etape-4` (prénoms → date → slug + création du wedding → confirmation "Votre site est prêt !").
- Une checklist post-dashboard existe déjà : `OnboardingChecklist` (5 items : photo, invités, cadeau, RSVP, partage du lien), affichée tant que `wedding.onboarding_completed_at` est null.
- Aucun sélecteur de thème n'existe nulle part dans l'app, bien que `theme_id` (colonne DB, défaut `'classic'`) et la constante `WEDDING_THEMES` (`classic`/`contemporary`) existent déjà et soient utilisés au rendu du site public.
- `updateWeddingSchema` accepte déjà un `themeId` optionnel et le transmet à l'update, mais `createWeddingSchema` ne l'a pas du tout — il faut l'ajouter au schéma de création, en plus de faire transmettre `theme_id` par l'action `createWedding` (aujourd'hui absent de l'insert).

Décision validée avec l'utilisateur : approche **hybride**. On étend le wizard pré-dashboard (bienvenue + thème ajoutés) et on allège/réordonne la checklist existante plutôt que de créer un nouveau système d'onboarding parallèle.

## Flow cible

Wizard pré-dashboard étendu de 4 à 6 écrans, routes renommées `/onboarding/etape-1` → `/onboarding/etape-6` :

1. **Bienvenue** *(nouveau)* — pas de formulaire, message d'accueil + CTA "Commencer". Pas de `"use client"` nécessaire (simple lien).
2. **Prénoms des mariés** *(existant, inchangé — actuel etape-1)*
3. **Date du mariage** *(existant, inchangé — actuel etape-2)*
4. **Choix du thème** *(nouveau)* — 2 cartes cliquables (Classique / Contemporain), mini-mockup codé en CSS/HTML (pas d'asset image externe — même logique que la recréation du hero sur la homepage marketing), thème `classic` pré-sélectionné par défaut.
5. **Adresse du site / slug** *(existant, renuméroté — actuel etape-3)* — c'est ici que `createWedding` est appelé ; le `themeId` choisi à l'écran 4 est inclus dans l'appel.
6. **Confirmation "Votre site est prêt !"** *(existant, inchangé — actuel etape-4)*

À l'arrivée sur `/dashboard`, la `OnboardingChecklist` existante est conservée mais modifiée :
- L'item "Partager votre lien avec vos proches" passe en première position (au lieu de dernière).
- Le titre de la card passe de "Démarrer votre mariage" à un intitulé qui enchaîne après l'écran de confirmation (ex. "Et maintenant ?").
- Aucun item supprimé, aucun changement de logique de complétion (`completedCount`, déclenchement de `completeOnboardingChecklist`).

## Composants et data flow

- **Constante** `ONBOARDING_STEPS` (`src/lib/constants.ts`) : `4` → `6`. `OnboardingStepIndicator` est déjà générique (basé sur cette constante), aucune modification de logique nécessaire.
- **Écran Bienvenue** — JSX inline dans `src/app/onboarding/etape-1/page.tsx` (Server Component, pas de form), sans composant séparé : cohérent avec l'écran de confirmation existant qui n'extrait pas non plus de composant pour du contenu non interactif.
- **Nouveau composant** `OnboardingThemeForm` (`"use client"`) — écran 4. Radio-cards basées sur `WEDDING_THEMES`, persiste `themeId` dans le même objet `sessionStorage["onboarding"]` que les autres étapes (pattern identique à `OnboardingStep1Form`/`OnboardingStep2Form`). Pas de validation Zod bloquante : une sélection par défaut existe toujours.
- **`createWeddingSchema`** (`src/lib/validators/wedding.ts`) : ajouter `themeId: z.string().optional()` (absent aujourd'hui, contrairement à `updateWeddingSchema` qui l'a déjà).
- **`createWedding`** (`src/actions/wedding.ts`) : transmettre `theme_id` à l'insert quand `themeId` est fourni (aujourd'hui seul `updateWedding` gère ce champ). Sans ce fix, le choix de thème à l'écran 4 serait silencieusement perdu (retombe sur le défaut DB `'classic'`).
- **Renumérotation des dossiers de routes** : `etape-1..4` existants deviennent `etape-2, 3, 5, 6` ; les nouveaux `etape-1` (bienvenue) et `etape-4` (thème) sont créés. `etape-1` reste l'URL d'entrée du wizard (seul son contenu change), donc **aucune modification n'est nécessaire** dans `src/app/(auth)/inscription/[[...sign-up]]/page.tsx` (`fallbackRedirectUrl="/onboarding/etape-1"`) ni dans `src/app/(dashboard)/layout.tsx` (`redirect("/onboarding/etape-1")`) — vérifié en préparant le plan. Seule la chaîne interne de redirections doit changer :
  - `src/components/dashboard/onboarding-step1-form.tsx`, `onboarding-step2-form.tsx` (×2), `onboarding-step3-form.tsx` (`router.push` en cascade, cibles décalées)
  - `src/components/dashboard/onboarding-complete-tracker.tsx` (commentaire référençant `etape-4`, à mettre à jour vers `etape-6`)
  - `src/app/robots.ts`, `src/instrumentation-client.ts` : utilisent déjà le préfixe générique `/onboarding` (pas de numéro d'étape) — vérifié, aucun changement requis.
- **Checklist** (`src/components/dashboard/onboarding-checklist.tsx`) : réordonnancement du tableau `items` + changement de copy (`CardTitle`). Aucun changement de logique.

## Hors scope (explicitement exclu)

- Pas de système d'invitation par email — "inviter ses proches" reste le lien à copier (mécanisme déjà existant dans la checklist).
- Pas de modification de la personnalisation couleur/police (section "Apparence" du dashboard, `VisualForm`) — reste séparée du choix de thème.
- Pas de possibilité de changer de thème après la création dans ce chantier (le thème sera éditable ailleurs si un futur chantier le demande — `theme_id` est déjà en DB, donc non bloquant).
- Pas de refonte du wording détaillé de chaque écran au-delà de ce qui est nécessaire (contenu exact des copies à affiner en implémentation, dans l'esprit du reste du wizard existant).

## Tests

Constat fait en préparant le plan d'implémentation : `@playwright/test` est une dépendance et `package.json` référence un script `test:a11y` → `tests/e2e/a11y`, mais aucune infra E2E n'existe réellement (`tests/e2e/` est vide, pas de `playwright.config.ts`). Bootstrapper cette infra est hors scope de ce chantier (décision validée avec l'utilisateur) — on se limite à :

- **Unit (Vitest)** :
  - `createWedding` avec `themeId` fourni → vérifie que `theme_id` est bien inséré avec la valeur choisie.
  - `createWedding` sans `themeId` → clé `theme_id` absente du payload d'insert, défaut DB `'classic'` toujours respecté (non-régression).
- **Vérification manuelle** (avant merge, pas automatisée) : parcours complet inscription → 6 écrans → dashboard dans le navigateur, en vérifiant que le thème choisi à l'écran 4 apparaît bien sur le rendu du site public (`/m/[slug]`) et que la checklist affiche "Invitez vos premiers proches" en premier item.

## Risques / points d'attention pour le plan d'implémentation

- La renumérotation de dossiers Next.js (`etape-1..4` → `etape-1..6`) est mécanique mais touche plusieurs fichiers en cascade — à faire dans un seul commit atomique, pas de déploiement intermédiaire.
- Le middleware Clerk existe sous le nom `src/proxy.ts` (pas `middleware.ts` — correction après vérification manuelle en exécutant le plan). Son matcher protège déjà `/onboarding(.*)` génériquement (`createRouteMatcher(["/dashboard(.*)", "/admin(.*)", "/onboarding(.*)"])`), donc les nouvelles routes `/onboarding/etape-5` et `etape-6` sont automatiquement couvertes — aucun changement requis.

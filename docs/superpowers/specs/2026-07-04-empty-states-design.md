# Bloc 3 — Chantier 2 : Empty states scénarisés

> Spec 2/4 du Bloc 3 (UX/conversion). Ordre d'exécution : 1 (onboarding, fait et poussé) > 2 (ce document) > 3 (FAQ homepage) > 4 (compteur social proof).

## Contexte

Demande initiale : les sections `/dashboard/invites`, `/dashboard/liste`, `/dashboard/budget` n'ont "pas d'empty state" et doivent en recevoir un, à l'image de `/dashboard/cagnotte` et `/dashboard/plan-de-table` qui utilisent déjà le composant `EmptyState` (`src/components/ui/empty-state.tsx` — icône Lucide, titre, description optionnelle, CTA bouton/lien).

État des lieux (vérifié dans le code avant design) : les trois sections ont en fait déjà un empty state **ad-hoc**, pas absent :
- `src/components/dashboard/gift-list-editor.tsx:80-86` (`/liste`) : `<div border-dashed>` avec 2 lignes de texte, sans icône, sans CTA intégré.
- `src/components/dashboard/budget-editor.tsx:218-226` (`/budget`) : même pattern.
- `src/components/dashboard/guest-editor.tsx:273-281` (`/invites`) : même pattern, avec **deux cas distincts** — vraiment vide (`guests.length === 0`) vs filtre actif sans résultat (`filtered.length === 0` mais `guests.length > 0`).

Dans les trois cas, le bouton "Ajouter" (cadeau / poste budgétaire / invité) est aujourd'hui rendu en permanence, en dehors du bloc vide — ce n'est pas le CTA de l'empty state actuel.

Note sur `/plan-de-table` : son usage d'`EmptyState` (`Monitor` icon, "Optimisé pour ordinateur") n'est PAS un cas de liste vide — c'est un message de garde mobile/desktop. Il ne sert donc pas de référence de ton pour ce chantier ; la seule référence de ton existante est `/cagnotte` (`HandCoins`, "Aucune contribution libre pour l'instant.").

## Décisions validées avec l'utilisateur

1. **CTA dupliqué** : quand la liste est réellement vide, le bouton "Ajouter" permanent est masqué — seul le CTA de l'`EmptyState` (qui déclenche le même formulaire/dialog d'ajout) est visible. Le bouton permanent réapparaît dès qu'il y a au moins un élément.
2. **Cas filtré (`/invites` uniquement)** : traité aussi via `EmptyState`, avec un CTA différent ("Réinitialiser les filtres" plutôt que "Ajouter un invité") puisque le problème n'est pas l'absence d'invités mais le filtre actif.

## Les 4 empty states

### `/invites` — vraiment vide (`guests.length === 0`)
- Icône : `Users`
- Titre : "Aucun invité pour l'instant."
- Description : "Ajoutez vos premiers invités pour commencer à gérer votre liste et suivre les RSVP."
- CTA : "Ajouter un invité" → `onClick` déclenche `setAddOpen(true)` (même mécanisme que le bouton permanent existant).

### `/invites` — filtre actif sans résultat (`filtered.length === 0 && guests.length > 0`)
- Icône : `FilterX`
- Titre : "Aucun invité pour ces filtres."
- Description : "Essayez d'élargir vos critères de recherche."
- CTA : "Réinitialiser les filtres" → `onClick` appelle `resetFilters()`, une petite fonction extraite qui remet `filterStatus`/`filterSide`/`filterGroup` à leurs valeurs par défaut. Le bouton "Réinitialiser" déjà présent dans la barre de filtres (`guest-editor.tsx:168-180`) est mis à jour pour appeler cette même fonction extraite, plutôt que de dupliquer la logique inline.

### `/liste` (cadeaux) — vide (`gifts.length === 0`)
- Icône : `Gift`
- Titre : "Aucun cadeau pour l'instant."
- Description : "Créez votre premier cadeau pour que vos invités puissent commencer à contribuer."
- CTA : "Ajouter un cadeau" → `onClick` déclenche `setAddOpen(true)` (ouvre le `Dialog` d'ajout existant).

### `/budget` — vide (`grouped.length === 0`)
- Icône : `Wallet`
- Titre : "Aucun poste budgétaire pour l'instant."
- Description : "Ajoutez vos postes de dépense pour suivre votre budget du jour J."
- CTA : "Ajouter un poste" → `onClick` déclenche `setAddOpen(true)` (affiche le formulaire inline d'ajout existant).

## Fichiers concernés

- `src/components/dashboard/guest-editor.tsx` : deux blocs `EmptyState` (vide / filtré), extraction de `resetFilters()`, masquage conditionnel du bouton "Ajouter un invité" (les boutons CSV import/export de `GuestCsvButtons` restent visibles dans tous les cas — utiles pour importer en masse même à vide).
- `src/components/dashboard/gift-list-editor.tsx` : un bloc `EmptyState`, masquage conditionnel du bouton "Ajouter un cadeau".
- `src/components/dashboard/budget-editor.tsx` : un bloc `EmptyState`, masquage conditionnel du bouton "Ajouter un poste".
- Aucun changement à `src/components/ui/empty-state.tsx` (composant générique déjà adapté, réutilisé tel quel).

## Hors scope (explicitement exclu)

- `/plan-de-table` et `/cagnotte` : déjà conformes, non touchés.
- Pas de nouvelle illustration/asset image — l'icône Lucide + fond du composant `EmptyState` existant suffit, conformément à la demande ("réutiliser le même composant, pas en créer un nouveau").
- Pas de changement à la barre de filtres elle-même sur `/invites` (Select de statut/côté/groupe) au-delà de l'extraction de `resetFilters()`.
- Pas de masquage des `Select` de filtres quand `/invites` est réellement vide — resterait visible mais sans effet notable ; non demandé, non touché.

## Tests

Aucun des trois fichiers n'a de test automatisé aujourd'hui (pas de framework de test au niveau composant dans ce repo — `vitest.config.ts` utilise `environment: "node"`, cohérent avec CLAUDE.md §15 "Pas de test pour : composants UI purement présentationnels"). Vérification manuelle : pour chaque section, vider la liste (compte de test sans invités/cadeaux/postes) et confirmer l'affichage de l'icône, du texte et du bon comportement du CTA ; pour `/invites`, vérifier aussi le cas filtré en activant un filtre qui ne retourne rien.

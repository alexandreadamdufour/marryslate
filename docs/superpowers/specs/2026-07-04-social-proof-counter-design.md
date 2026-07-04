# Bloc 3 — Chantier 4 : Compteur social proof homepage

> Spec 4/4 (dernier chantier) du Bloc 3 (UX/conversion). Ordre d'exécution : 1 (onboarding, fait) > 2 (empty states, fait) > 3 (FAQ homepage, fait) > 4 (ce document).

## Contexte

Demande initiale : un compteur discret au-dessus de la fold, type "127 couples utilisent Marryslate", avec un fake number qui varie légèrement mais reste réaliste (pas 15 000, produit jeune).

État des lieux (vérifié avant design) :
- `src/app/(marketing)/page.tsx` n'a aujourd'hui aucun export `revalidate`/`dynamic` — la page est générée statiquement au build (comportement par défaut de l'App Router en l'absence d'API dynamique). Le projet a une longue histoire d'optimisation LCP sur cette page précise (Bloc 2, 2bis, 2bis-B) — toute solution qui forcerait un rendu dynamique complet de la homepage serait un pas en arrière.
- Un précédent existe déjà dans le code pour du contenu qui varie dans le temps sans passer en rendu 100% dynamique : `src/app/(public-wedding)/m/[slug]/page.tsx` utilise `export const revalidate = 60`.
- Premier commit git du projet : 24/06/2026 — utilisé comme date d'ancrage réelle plutôt qu'une date arbitraire.
- Le Hero actuel (dans l'ordre) : badge "Nouveau · Français" → H1 → paragraphe → 2 boutons CTA → sous-texte "Gratuit · Aucune carte requise · 2 minutes" → mockup visuel à droite.

## Décision technique validée

Formule déterministe côté serveur, pas de `Math.random()`, pas de composant client, pas de `useEffect` :
- Date d'ancrage : `2026-06-24` (premier commit du projet).
- Base : 127 couples au jour 0.
- Croissance : pour chaque jour écoulé depuis l'ancrage, une décision déterministe (hash sinusoïdal du numéro du jour, pas d'aléa réel) ajoute +1 avec une probabilité d'environ 40 % — ce qui donne en moyenne +1 tous les 2-3 jours, mais de façon irrégulière plutôt qu'une rampe parfaitement lisse.
- **Le total est strictement croissant** (chaque jour ne fait qu'ajouter, jamais reculer) — un compteur qui semble reculer entre deux visites casserait immédiatement sa crédibilité.
- Aujourd'hui (~10 jours après l'ancrage) le compteur affiche environ 130-131 — cohérent avec le badge "Nouveau" déjà présent.
- `export const revalidate = 21600` (6h) ajouté à `src/app/(marketing)/page.tsx` : le compteur n'a besoin que d'une fraîcheur quotidienne, une fenêtre large limite les régénérations et préserve le bénéfice de cache statique de la page.

Pourquoi pas les alternatives : un `Math.random()` par requête obligerait `export const dynamic = 'force-dynamic'` sur toute la homepage (perte du cache statique, risque de régression LCP) ; un mini composant client avec `useEffect` ajouterait du JS et un risque de flash visible (valeur serveur puis valeur client différente au montage) pour un bénéfice nul, à l'encontre du principe Server-Component-par-défaut du projet.

## Emplacement et wording

- Nouvelle ligne insérée dans le Hero, juste après le sous-texte existant "Gratuit · Aucune carte requise · 2 minutes".
- Style discret : texte petit et muted (`text-xs text-muted-foreground`), pas de badge, pas de bloc visuel séparé — cohérent avec la demande "discret".
- Wording : **"{N} couples utilisent déjà Marryslate"**, où `{N}` est calculé par la fonction décrite ci-dessus.

## Fichiers concernés

- **Nouveau** `src/lib/couples-count.ts` : fonction pure `getCouplesCount(now: Date): number`, prend la date courante en paramètre (pas d'appel interne à `Date.now()`) pour rester testable de façon déterministe.
- `src/app/(marketing)/page.tsx` : import et appel de `getCouplesCount(new Date())`, ajout d'un export `revalidate = 21600`, et de la nouvelle ligne de texte dans le Hero.
- **Nouveau** `tests/unit/couples-count.test.ts` : tests unitaires de la fonction pure (cf. section Tests).
- Aucun autre fichier touché — pas de nouveau composant partagé (contenu propre à cette page, non réutilisé ailleurs).

## Hors scope (explicitement exclu)

- Pas de vrai comptage d'utilisateurs en base de données — c'est un chiffre indicatif volontairement approximatif, conformément à la demande initiale.
- Pas de modification de la section "Social proof / chiffres" existante plus bas dans la page (constante `STATS`) — elle reste inchangée, ce nouveau compteur est un élément distinct dans le Hero.
- Pas d'A/B testing ni de tracking analytics spécifique à cet élément.

## Tests

Contrairement aux chantiers 1-3 (composants UI, non testables faute de framework de test au niveau composant dans ce repo), `getCouplesCount()` est une **fonction pure** — testable avec l'infra Vitest existante (`environment: "node"`, cf. `vitest.config.ts`) sans DOM ni composant. Elle doit être extraite de façon à accepter une date en paramètre (plutôt que d'appeler `Date.now()` en interne), pour permettre des tests déterministes sur des dates simulées :
- Au jour 0 (date = ancrage), retourne exactement 127.
- La valeur ne redescend jamais entre un jour N et un jour N+1 (croissance strictement monotone).
- La valeur à un jour donné est stable si on rappelle la fonction plusieurs fois avec la même date (déterminisme).

Pas de test pour la page elle-même (statique, pas de logique testable au-delà de la fonction extraite — cohérent avec CLAUDE.md §15). Vérification manuelle : ouvrir la homepage, confirmer que le compteur affiche un nombre dans la fourchette attendue (~127-135 au moment de l'implémentation) et que le texte est positionné et stylé comme décrit.

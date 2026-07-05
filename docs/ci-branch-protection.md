# Branch protection sur `main`

> Marche à suivre GitHub UI — non automatisable sans PAT (Personal Access
> Token) avec droits admin sur le repo, donc fait manuellement une fois.

## Objectif

Empêcher qu'une Pull Request soit mergée dans `main` si le job CI (`ci`,
voir `.github/workflows/ci.yml`) est rouge. Le commit direct sur `main` en
solo (CLAUDE.md §14) reste possible — cette protection ne s'applique qu'au
merge de PR, pas au push direct.

## Étapes

1. Aller sur `https://github.com/alexandreadamdufour/amora/settings/branches`
2. Cliquer **Add branch protection rule** (ou éditer la règle existante sur
   `main` si elle existe déjà)
3. Dans **Branch name pattern**, saisir `main`
4. Cocher **Require status checks to pass before merging**
5. Dans la liste des checks, sélectionner **ci** (le nom du job défini dans
   `.github/workflows/ci.yml` — n'apparaît dans la liste qu'après au moins
   une exécution du workflow sur une PR)
6. **Ne pas cocher** "Require a pull request before merging" — ça
   bloquerait le push direct sur `main`, contraire à CLAUDE.md §14
7. **Ne pas cocher** "Restrict who can push to matching branches" — même
   raison
8. Cliquer **Create** (ou **Save changes**)

## Vérification

- Un push direct sur `main` doit continuer à fonctionner normalement
- Une PR avec le job `ci` en échec doit afficher le bouton "Merge" grisé
  avec le message "Required status check ci has not succeeded"

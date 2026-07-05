# CI/CD basique GitHub Actions — design

Date : 2026-07-05

## Contexte

Une régression sessionStorage sur `/onboarding/etape-4` (accès en render-time
au lieu de `useEffect`, corrigée en 4b4545f) a bloqué 4 déploiements Vercel
d'affilée sans détection automatique — découverte 2h après en testant
manuellement en prod. Objectif : que ce genre de régression déclenche une
alerte immédiate, pas une découverte manuelle.

Le repo a déjà un `.github/workflows/ci.yml` (committé en 702bcee, sprint
fondateur) avec 3 jobs **parallèles** (`typecheck`, `lint`, `test`), chacun
avec son propre checkout + install. Il manque un job `build`, qui est
probablement ce qui aurait intercepté cette régression précise : un accès à
`sessionStorage` en render-time provoque une `ReferenceError` au moment du
prerendering SSR par `next build` (sessionStorage n'existe pas côté Node).

Hors scope : Playwright E2E (chantier séparé, pas d'infra E2E ici).

## 1. Structure du workflow

Un seul job `ci`, steps séquentiels (remplace les 3 jobs parallèles actuels) :

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - name: Notify ntfy on failure
        if: failure()
        env:
          NTFY_TOPIC: ${{ secrets.NTFY_TOPIC }}
        run: |
          curl -H "Title: CI Marryslate a échoué" \
               -H "Priority: high" \
               -d "Branche ${{ github.ref_name }} — voir ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" \
               "https://ntfy.sh/$NTFY_TOPIC"
```

Rationale : un seul runner, un seul checkout/install, fail-fast natif de
GitHub Actions (un step qui échoue arrête le job — les steps suivants ne
tournent jamais). Économie de minutes CI maximale sur un échec précoce
(typecheck), au prix d'un seul log agrégé au lieu de 3 jobs visibles
séparément dans l'onglet Actions — acceptable pour un solo dev.

Déclencheurs inchangés : `push: branches: [main]` et
`pull_request: branches: [main]` (déjà en place).

Les env vars placeholder existantes (`NEXT_PUBLIC_SUPABASE_URL`,
`CLERK_SECRET_KEY`, etc., nécessaires à la validation Zod de `lib/env.ts`)
restent définies au niveau du workflow et couvrent maintenant aussi `test` et
`build` (précédemment seuls `typecheck`/`lint` en avaient besoin).

Versions d'actions : `actions/checkout@v4`, `pnpm/action-setup@v4` (version
9), `actions/setup-node@v4` — inchangées par rapport à l'existant (vérifié
via Context7 que ces versions restent fonctionnelles ; pas de bump non
sollicité par cette tâche).

## 2. Notification ntfy

Step unique en fin de job, `if: failure()` (se déclenche si n'importe quel
step précédent a échoué). `curl` direct vers `ntfy.sh` — pas de GitHub Action
tierce, zéro dépendance supply-chain supplémentaire pour 5 lignes de shell.

Le topic ntfy est stocké dans un secret GitHub `NTFY_TOPIC` (repo → Settings
→ Secrets and variables → Actions → New repository secret), pas en clair
dans le yaml — même si le repo est privé, le nom de topic agit comme un
jeton d'accès de facto au service public ntfy.sh (quiconque le connaît peut
publier/lire dessus), cohérent avec la pratique déjà en place pour les
autres secrets du projet.

**Prérequis avant le test e2e (section 4)** : le secret `NTFY_TOPIC` doit
être créé manuellement dans GitHub avant d'ouvrir la PR de test, sinon la
notif échouera silencieusement (curl vers `ntfy.sh/` sans topic = 404).

## 3. Doc branch protection

Nouveau fichier `docs/ci-branch-protection.md` documentant la marche à
suivre GitHub UI (non automatisable sans PAT) :

- Settings → Branches → Add branch protection rule → `main`
- Cocher **Require status checks to pass before merging**, sélectionner le
  check `ci`
- Ne pas cocher "Require a pull request before merging" ni "Restrict who can
  push" — le commit direct sur `main` en solo (CLAUDE.md §14) reste
  possible ; seul le merge d'une PR est bloqué si `ci` est rouge.

## 4. Test de bout en bout

1. `git checkout -b fix/ci-test`
2. Commit qui casse volontairement le typecheck (variable non déclarée)
3. `git push -u origin fix/ci-test`
4. `gh pr create` vers `main` (déclenche le trigger `pull_request`, valide
   aussi ce chemin de la notif, pas seulement `push`)
5. Vérifier : le job `ci` échoue au step `pnpm typecheck`, les steps
   suivants ne tournent pas, la notif ntfy arrive
6. `gh pr close --delete-branch` — pas de merge, pas de rollback nécessaire,
   `main` n'est jamais touché

Chaque action qui touche le remote (push, création de PR, fermeture) sera
confirmée avec l'utilisateur avant exécution, comme d'habitude.

## Hors scope

- Playwright E2E (chantier séparé)
- CI bloquant le push direct sur `main` (voir section 3 — décision explicite
  de ne pas changer CLAUDE.md §14)
- Toute action tierce pour ntfy (curl direct retenu)

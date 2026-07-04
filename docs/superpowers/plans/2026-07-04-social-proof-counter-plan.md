# Bloc 3 — Chantier 4 : Compteur social proof homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un compteur "social proof" discret dans le Hero de la homepage (`src/app/(marketing)/page.tsx`), affichant un nombre de couples calculé par une fonction pure déterministe et strictement croissante, conformément à `docs/superpowers/specs/2026-07-04-social-proof-counter-design.md`.

**Architecture:** Une fonction pure `getCouplesCount(now: Date): number` isolée dans `src/lib/couples-count.ts` (testable en Vitest, aucun effet de bord, aucun `Math.random()`), appelée depuis la homepage avec `new Date()`. La homepage passe de statique-sans-revalidation à `export const revalidate = 21600` (6h) pour que le nombre affiché se régénère périodiquement sans repasser en rendu dynamique complet.

**Tech Stack:** Next.js 16 App Router (ISR via `revalidate`), TypeScript strict, Vitest (`environment: "node"`, déjà configuré).

## Global Constraints

- Date d'ancrage : `2026-06-24T00:00:00Z` (premier commit du projet).
- Base : 127 couples au jour 0.
- Probabilité de croissance journalière : 0.4 (≈ 40 %), hash déterministe `Math.sin(day * 12.9898) * 43758.5453` puis partie fractionnaire — pas de `Math.random()`.
- La fonction doit être **strictement croissante** dans le temps (jamais de régression d'un jour à l'autre) et **déterministe** (même date en entrée → même résultat en sortie, à chaque appel).
- `getCouplesCount` prend la date courante en paramètre — jamais d'appel interne à `Date.now()`/`new Date()` sans argument à l'intérieur de la fonction, pour rester testable.
- Pas de composant client, pas de `useEffect`, pas de `useState` pour ce compteur.
- Pas de test au niveau de la page (statique, pas de logique testable au-delà de la fonction extraite) — seule la fonction pure de `src/lib/couples-count.ts` a des tests Vitest.
- Commits en conventional commits, changements chirurgicaux uniquement.

---

### Task 1: Fonction pure `getCouplesCount`

**Files:**
- Create: `src/lib/couples-count.ts`
- Test: `tests/unit/couples-count.test.ts`

**Interfaces:**
- Produces: `export function getCouplesCount(now: Date): number` — consommée par Task 2 (`src/app/(marketing)/page.tsx`).

- [ ] **Step 1: Write the failing tests**

Créer `tests/unit/couples-count.test.ts` :

```ts
import { describe, it, expect } from "vitest"
import { getCouplesCount } from "@/lib/couples-count"

const LAUNCH_DATE = new Date("2026-06-24T00:00:00Z")

function daysAfterLaunch(days: number): Date {
  return new Date(LAUNCH_DATE.getTime() + days * 86_400_000)
}

describe("getCouplesCount", () => {
  it("retourne exactement 127 au jour 0 (date d'ancrage)", () => {
    expect(getCouplesCount(LAUNCH_DATE)).toBe(127)
  })

  it("retourne 131 après 10 jours (valeur de référence calculée)", () => {
    expect(getCouplesCount(daysAfterLaunch(10))).toBe(131)
  })

  it("retourne 137 après 30 jours (valeur de référence calculée)", () => {
    expect(getCouplesCount(daysAfterLaunch(30))).toBe(137)
  })

  it("ne redescend jamais d'un jour à l'autre sur 90 jours (croissance strictement monotone)", () => {
    let previous = getCouplesCount(daysAfterLaunch(0))
    for (let day = 1; day <= 90; day++) {
      const current = getCouplesCount(daysAfterLaunch(day))
      expect(current).toBeGreaterThanOrEqual(previous)
      previous = current
    }
  })

  it("est déterministe : appeler plusieurs fois avec la même date donne le même résultat", () => {
    const date = daysAfterLaunch(30)
    expect(getCouplesCount(date)).toBe(getCouplesCount(date))
  })

  it("retourne la base (127) pour une date antérieure à l'ancrage", () => {
    const before = new Date(LAUNCH_DATE.getTime() - 86_400_000)
    expect(getCouplesCount(before)).toBe(127)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/couples-count.test.ts`
Expected: FAIL — le module `@/lib/couples-count` n'existe pas encore (erreur de résolution de module).

- [ ] **Step 3: Write minimal implementation**

Créer `src/lib/couples-count.ts` :

```ts
const LAUNCH_DATE = new Date("2026-06-24T00:00:00Z")
const BASE_COUPLES_COUNT = 127
const DAILY_GROWTH_PROBABILITY = 0.4

// Hash déterministe (pas d'aléa réel) : même jour -> même valeur, à chaque appel.
function dayHash(day: number): number {
  const x = Math.sin(day * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function getCouplesCount(now: Date): number {
  const daysSinceLaunch = Math.max(
    0,
    Math.floor((now.getTime() - LAUNCH_DATE.getTime()) / 86_400_000)
  )

  let count = BASE_COUPLES_COUNT
  for (let day = 1; day <= daysSinceLaunch; day++) {
    if (dayHash(day) < DAILY_GROWTH_PROBABILITY) count += 1
  }
  return count
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/couples-count.test.ts`
Expected: PASS — les 6 tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/lib/couples-count.ts tests/unit/couples-count.test.ts
git commit -m "feat(marketing): ajoute une fonction déterministe de comptage social proof"
```

---

### Task 2: Intégrer le compteur dans le Hero de la homepage

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `getCouplesCount(now: Date): number` (Task 1, `@/lib/couples-count`).

- [ ] **Step 1: Ajouter l'import et l'export `revalidate`**

Dans `src/app/(marketing)/page.tsx`, remplacer :

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { FeatureBentoGrid } from "@/components/marketing/feature-bento-grid"
import { env } from "@/lib/env"
import { INSCRIPTION_ROUTE } from "@/lib/constants"
```

par :

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { FeatureBentoGrid } from "@/components/marketing/feature-bento-grid"
import { env } from "@/lib/env"
import { INSCRIPTION_ROUTE } from "@/lib/constants"
import { getCouplesCount } from "@/lib/couples-count"

// Le compteur social proof n'a besoin que d'une fraîcheur quotidienne — une
// fenêtre large limite les régénérations et préserve le cache statique de
// cette page (historique d'optimisation LCP, cf. Bloc 2/2bis).
export const revalidate = 21600 // 6h
```

- [ ] **Step 2: Insérer la ligne du compteur dans le Hero**

Remplacer :

```tsx
export default function HomePage() {
  return (
```

par :

```tsx
export default function HomePage() {
  const couplesCount = getCouplesCount(new Date())

  return (
```

Puis remplacer :

```tsx
          <p className="text-sm text-muted-foreground">
            Gratuit · Aucune carte requise · 2 minutes
          </p>
        </div>
```

par :

```tsx
          <p className="text-sm text-muted-foreground">
            Gratuit · Aucune carte requise · 2 minutes
          </p>
          <p className="text-xs text-muted-foreground">
            {couplesCount} couples utilisent déjà Marryslate
          </p>
        </div>
```

- [ ] **Step 3: Vérification**

Run: `pnpm typecheck && pnpm lint`
Expected: les deux commandes passent sans erreur.

Vérification manuelle : `pnpm dev` (sur un port libre, ex. `pnpm exec next dev -p 3001` si 3000 est occupé), ouvrir `/`. La ligne "{N} couples utilisent déjà Marryslate" apparaît en petit texte discret sous "Gratuit · Aucune carte requise · 2 minutes", avec un nombre autour de 130-135 (10 jours après le 24/06/2026 = 131, cf. Task 1). Vérifier que la section "Social proof / chiffres" plus bas (STATS) et la section FAQ restent inchangées.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)/page.tsx"
git commit -m "feat(marketing): affiche le compteur social proof dans le Hero"
```

---

### Task 3: Vérification finale et push

**Files:** aucun (vérification uniquement)

- [ ] **Step 1: Suite de vérifications complète**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck et lint passent sans erreur. `pnpm test` : les mêmes 2 suites pré-existantes et sans rapport (`tests/unit/actions/rsvp.test.ts`, `tests/unit/api/stripe-webhook.test.ts`) peuvent échouer pour une raison de configuration d'environnement déjà connue (Bloc 3, chantiers 1-3) — tous les autres tests, y compris les 6 nouveaux de `couples-count.test.ts`, doivent passer.

- [ ] **Step 2: Vérification manuelle finale**

Run: `pnpm dev` (ou `pnpm exec next dev -p 3001`)
Expected : parcours visuel de la homepage, confirmer que le compteur s'affiche correctement dans le Hero (desktop et mobile), sans rupture visuelle avec le reste de la page.

- [ ] **Step 3: Push**

```bash
git push
```

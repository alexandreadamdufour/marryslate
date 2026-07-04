# Bloc 3 — Chantier 1 : Onboarding guidé première connexion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Étendre le wizard d'onboarding pré-dashboard de 4 à 6 écrans (Bienvenue → Prénoms → Date → Thème → Slug → Confirmation) et réordonner la checklist dashboard existante, conformément à `docs/superpowers/specs/2026-07-04-onboarding-guide-design.md`.

**Architecture:** Renumérotation en place des routes Next.js `src/app/onboarding/etape-{1..6}`, deux écrans neufs (Bienvenue, Thème) insérés dans la séquence existante, un nouveau composant client `OnboardingThemeForm`, et un fix de bout en bout pour que le `themeId` choisi survive jusqu'à l'insert `createWedding`. Aucun changement de logique dans la checklist dashboard — réordonnancement + copy uniquement.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, react-hook-form + Zod (formulaires existants inchangés dans leur structure), Supabase (`@supabase/ssr`), Vitest pour les tests unitaires.

## Global Constraints

- Server Components par défaut ; `"use client"` uniquement pour l'interactivité (hooks, event handlers). Le nouvel écran Bienvenue est un Server Component pur (juste un `Link`).
- Toutes les mutations passent par des Server Actions déjà existantes (`createWedding`) — pas de nouvelle route API.
- Nommage : fichiers en kebab-case, composants React en PascalCase, fonctions/vars en camelCase (CLAUDE.md §13).
- Pas de `pnpm typecheck`/`lint` en pre-commit (hook volontairement absent) — à lancer manuellement avant push.
- Commits en conventional commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`), un commit atomique et testé par tâche (CLAUDE.md §17), tous poussés ensemble à la toute fin après vérification manuelle complète du parcours (pas de déploiement intermédiaire d'un état de renumérotation à moitié fait).
- Pas de tests Playwright dans ce chantier (infra E2E absente du repo, hors scope — voir section Tests du spec). Vérification manuelle avant push.
- Pas de renommage des fichiers de composants de formulaire existants (`onboarding-step1-form.tsx` etc.) même si leur écran change de numéro — changements chirurgicaux uniquement (Karpathy §3).

---

### Task 1: Thème transmis à la création du wedding (data layer)

**Files:**
- Modify: `src/lib/validators/wedding.ts`
- Modify: `src/actions/wedding.ts`
- Test: `tests/unit/actions/wedding.test.ts`

**Interfaces:**
- Consumes: `WEDDING_THEMES`/`WeddingThemeId` (déjà exportés par `src/lib/constants.ts`, inchangés dans cette tâche).
- Produces: `CreateWeddingInput` inclut désormais `themeId?: string`, consommé par `OnboardingStep3Form` (Task 6).

- [ ] **Step 1: Write the failing tests**

Ajouter dans `tests/unit/actions/wedding.test.ts`, après le `describe("createWedding — gestion de la race condition...")` existant (donc en fin de fichier) :

```ts
describe("createWedding — thème choisi à l'onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: CLERK_USER_ID } as never)
    mockCurrentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "alice@example.com" }],
      firstName: "Alice",
      lastName:  "Martin",
    } as never)
    mockCreateAdmin.mockReturnValue(
      makeAdminClient({ data: { id: USER_ID }, error: null }) as never
    )
  })

  it("themeId fourni : transmis à l'insert sous theme_id", async () => {
    const { client, captures } = makeMockSupabase({
      weddings:         [{ data: { id: WEDDING_ID, slug: SLUG }, error: null }],
      wedding_coowners: [{ data: null, error: null }],
    })
    mockCreateClient.mockResolvedValue(client as never)

    await createWedding({ ...VALID_INPUT, themeId: "contemporary" })

    expect(captures.inserts.weddings[0]).toMatchObject({ theme_id: "contemporary" })
  })

  it("themeId absent : pas de clé theme_id dans l'insert (défaut DB conservé)", async () => {
    const { client, captures } = makeMockSupabase({
      weddings:         [{ data: { id: WEDDING_ID, slug: SLUG }, error: null }],
      wedding_coowners: [{ data: null, error: null }],
    })
    mockCreateClient.mockResolvedValue(client as never)

    await createWedding(VALID_INPUT)

    expect(captures.inserts.weddings[0]).not.toHaveProperty("theme_id")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/actions/wedding.test.ts -t "thème choisi"`
Expected: FAIL — `themeId` n'existe pas sur le type `CreateWeddingInput` (erreur TS) et/ou `theme_id` absent du payload capturé même quand fourni.

- [ ] **Step 3: Add `themeId` to `createWeddingSchema`**

Dans `src/lib/validators/wedding.ts`, remplacer :

```ts
export const createWeddingSchema = z.object({
  partner1FirstName: z.string().min(1, "Requis").max(50),
  partner2FirstName: z.string().min(1, "Requis").max(50),
  weddingDate: z.string().optional(),
  slug: slugSchema,
})
```

par :

```ts
export const createWeddingSchema = z.object({
  partner1FirstName: z.string().min(1, "Requis").max(50),
  partner2FirstName: z.string().min(1, "Requis").max(50),
  weddingDate: z.string().optional(),
  themeId: z.string().optional(),
  slug: slugSchema,
})
```

- [ ] **Step 4: Pass `theme_id` through in `createWedding`**

Dans `src/actions/wedding.ts`, remplacer :

```ts
  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({
      owner_id: user.id,
      partner1_first_name: parsed.data.partner1FirstName,
      partner2_first_name: parsed.data.partner2FirstName,
      wedding_date: parsed.data.weddingDate ?? null,
      slug: parsed.data.slug,
    })
    .select("id, slug")
    .single()
```

par :

```ts
  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({
      owner_id: user.id,
      partner1_first_name: parsed.data.partner1FirstName,
      partner2_first_name: parsed.data.partner2FirstName,
      wedding_date: parsed.data.weddingDate ?? null,
      slug: parsed.data.slug,
      ...(parsed.data.themeId !== undefined && { theme_id: parsed.data.themeId }),
    })
    .select("id, slug")
    .single()
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/actions/wedding.test.ts`
Expected: PASS — tous les tests du fichier, y compris les 2 nouveaux et les 3 existants (non-régression).

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/wedding.ts src/actions/wedding.ts tests/unit/actions/wedding.test.ts
git commit -m "feat(onboarding): transmet le themeId choisi à la création du wedding"
```

---

### Task 2: Écran 1 — Bienvenue (nouveau)

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/app/onboarding/etape-1/page.tsx` (remplace le contenu "Prénoms" — déplacé en Task 3)

**Interfaces:**
- Consumes: `OnboardingStepIndicator` (`src/components/dashboard/onboarding-step-indicator.tsx`, inchangé, générique via `ONBOARDING_STEPS`).
- Produces: route `/onboarding/etape-1` affiche désormais l'écran Bienvenue, avec un lien statique vers `/onboarding/etape-2`.

- [ ] **Step 1: Bump `ONBOARDING_STEPS` à 6**

Dans `src/lib/constants.ts`, remplacer :

```ts
export const ONBOARDING_STEPS = 4
```

par :

```ts
export const ONBOARDING_STEPS = 6
```

- [ ] **Step 2: Remplacer le contenu de `src/app/onboarding/etape-1/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Bienvenue" }

export default function OnboardingWelcomePage() {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <OnboardingStepIndicator currentStep={1} />
      <div className="space-y-4">
        <div className="text-6xl">💍</div>
        <h1 className="text-3xl">Bienvenue sur Marryslate</h1>
        <p className="text-muted-foreground">
          Créons ensemble votre site de mariage. Ça prend environ 2 minutes.
        </p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/onboarding/etape-2">Commencer</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, puis ouvrir `http://localhost:3000/onboarding/etape-1`.
Expected : indicateur de progression affiche 6 puces (1ère active), message de bienvenue visible, clic sur "Commencer" navigue vers `/onboarding/etape-2` (contenu encore "Prénoms" à ce stade — normal, corrigé en Task 3).

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts "src/app/onboarding/etape-1/page.tsx"
git commit -m "feat(onboarding): ajoute l'écran Bienvenue et passe le wizard à 6 étapes"
```

---

### Task 3: Écran 2 — Prénoms (renuméroté depuis l'ancien etape-1)

**Files:**
- Modify: `src/app/onboarding/etape-2/page.tsx` (contenait la date — remplacé par le contenu "Prénoms")
- Modify: `src/components/dashboard/onboarding-step1-form.tsx`

**Interfaces:**
- Consumes: `OnboardingStep1Form` (composant inchangé dans sa structure, seul le `router.push` interne change).
- Produces: après soumission du formulaire prénoms, redirection vers `/onboarding/etape-3`.

- [ ] **Step 1: Remplacer le contenu de `src/app/onboarding/etape-2/page.tsx`**

```tsx
import type { Metadata } from "next"
import { OnboardingStep1Form } from "@/components/dashboard/onboarding-step1-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 2" }

export default function OnboardingStep1Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={2} />
      <div className="space-y-2">
        <h1 className="text-3xl">Qui sont les mariés ?</h1>
        <p className="text-muted-foreground">Ces prénoms apparaîtront sur votre site mariage.</p>
      </div>
      <OnboardingStep1Form />
    </div>
  )
}
```

- [ ] **Step 2: Mettre à jour la redirection dans `onboarding-step1-form.tsx`**

Dans `src/components/dashboard/onboarding-step1-form.tsx`, remplacer :

```ts
    sessionStorage.setItem("onboarding", JSON.stringify(values))
    router.push("/onboarding/etape-2")
```

par :

```ts
    sessionStorage.setItem("onboarding", JSON.stringify(values))
    router.push("/onboarding/etape-3")
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, ouvrir `http://localhost:3000/onboarding/etape-2`, remplir les deux prénoms, cliquer "Suivant".
Expected : indicateur affiche l'étape 2/6 active, soumission redirige vers `/onboarding/etape-3` (contenu encore "Date" à ce stade — normal, corrigé en Task 4).

- [ ] **Step 4: Commit**

```bash
git add "src/app/onboarding/etape-2/page.tsx" src/components/dashboard/onboarding-step1-form.tsx
git commit -m "feat(onboarding): renumérote l'écran Prénoms en étape 2"
```

---

### Task 4: Écran 3 — Date (renuméroté depuis l'ancien etape-2)

**Files:**
- Modify: `src/app/onboarding/etape-3/page.tsx` (contenait le slug — remplacé par le contenu "Date")
- Modify: `src/components/dashboard/onboarding-step2-form.tsx`

**Interfaces:**
- Consumes: `OnboardingStep2Form` (composant inchangé dans sa structure, les deux `router.push` internes changent de cible).
- Produces: après soumission (ou skip) du formulaire date, redirection vers `/onboarding/etape-4`.

- [ ] **Step 1: Remplacer le contenu de `src/app/onboarding/etape-3/page.tsx`**

```tsx
import type { Metadata } from "next"
import { OnboardingStep2Form } from "@/components/dashboard/onboarding-step2-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 3" }

export default function OnboardingStep2Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={3} />
      <div className="space-y-2">
        <h1 className="text-3xl">Quelle est la date de votre mariage ?</h1>
        <p className="text-muted-foreground">Vous pourrez la modifier plus tard.</p>
      </div>
      <OnboardingStep2Form />
    </div>
  )
}
```

- [ ] **Step 2: Mettre à jour les deux redirections dans `onboarding-step2-form.tsx`**

Dans `src/components/dashboard/onboarding-step2-form.tsx`, remplacer la première occurrence :

```ts
    const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, ...values }))
    router.push("/onboarding/etape-3")
```

par :

```ts
    const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, ...values }))
    router.push("/onboarding/etape-4")
```

et la seconde occurrence (bouton "Je ne sais pas encore") :

```ts
          onClick={() => {
            const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
            sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, weddingDate: undefined }))
            router.push("/onboarding/etape-3")
          }}
```

par :

```ts
          onClick={() => {
            const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
            sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, weddingDate: undefined }))
            router.push("/onboarding/etape-4")
          }}
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, ouvrir `http://localhost:3000/onboarding/etape-3`, tester les deux chemins (saisir une date, et "Je ne sais pas encore").
Expected : indicateur affiche l'étape 3/6 active, les deux boutons redirigent vers `/onboarding/etape-4` (contenu encore "Confirmation" à ce stade — normal, corrigé en Task 5).

- [ ] **Step 4: Commit**

```bash
git add "src/app/onboarding/etape-3/page.tsx" src/components/dashboard/onboarding-step2-form.tsx
git commit -m "feat(onboarding): renumérote l'écran Date en étape 3"
```

---

### Task 5: Écran 4 — Choix du thème (nouveau)

**Files:**
- Create: `src/components/dashboard/onboarding-theme-form.tsx`
- Modify: `src/app/onboarding/etape-4/page.tsx` (contenait la confirmation — remplacé par le picker de thème)

**Interfaces:**
- Consumes: `WEDDING_THEMES`, `WeddingThemeId` (`src/lib/constants.ts`), classes CSS `.theme-classic`/`.theme-contemporary` déjà définies dans `src/app/globals.css`.
- Produces: `OnboardingThemeForm`, persiste `themeId: WeddingThemeId` dans `sessionStorage["onboarding"]`, consommé par `OnboardingStep3Form` (Task 6). Redirige vers `/onboarding/etape-5`.

- [ ] **Step 1: Créer `src/components/dashboard/onboarding-theme-form.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WEDDING_THEMES, type WeddingThemeId } from "@/lib/constants"

export function OnboardingThemeForm() {
  const router = useRouter()
  const [selected, setSelected] = useState<WeddingThemeId>("classic")

  function onSubmit() {
    const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, themeId: selected }))
    router.push("/onboarding/etape-5")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {WEDDING_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelected(theme.id)}
            aria-pressed={selected === theme.id}
            aria-label={`Choisir le thème ${theme.label}`}
            className={cn(
              "relative overflow-hidden rounded-xl border-2 text-left transition-colors",
              selected === theme.id ? "border-primary" : "border-border"
            )}
          >
            {selected === theme.id && (
              <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
            <div
              className={cn(
                theme.id === "classic" ? "theme-classic" : "theme-contemporary",
                "flex flex-col gap-1 bg-background p-4"
              )}
            >
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Alex &amp; Louise
              </span>
              <h3 className="text-lg text-foreground">Notre mariage</h3>
              <div className="mt-1 h-1.5 w-10 rounded-full bg-primary" />
            </div>
            <p className="border-t px-4 py-3 text-sm font-medium">{theme.label}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          Retour
        </Button>
        <Button type="button" className="flex-1" onClick={onSubmit}>
          Suivant
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remplacer le contenu de `src/app/onboarding/etape-4/page.tsx`**

```tsx
import type { Metadata } from "next"
import { OnboardingThemeForm } from "@/components/dashboard/onboarding-theme-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 4" }

export default function OnboardingStep4ThemePage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={4} />
      <div className="space-y-2">
        <h1 className="text-3xl">Choisissez votre thème</h1>
        <p className="text-muted-foreground">
          Vous pourrez en changer plus tard depuis votre tableau de bord.
        </p>
      </div>
      <OnboardingThemeForm />
    </div>
  )
}
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, ouvrir `http://localhost:3000/onboarding/etape-4`.
Expected : 2 cartes côte à côte, mockup "Classique" en serif/ton terracotta, mockup "Contemporain" en sans-serif/noir&blanc, sélection par défaut sur "Classique" (coche visible), clic sur l'autre carte bascule la sélection, "Suivant" redirige vers `/onboarding/etape-5` (contenu encore "Slug" ancien à ce stade — normal, corrigé en Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/onboarding-theme-form.tsx "src/app/onboarding/etape-4/page.tsx"
git commit -m "feat(onboarding): ajoute l'écran de choix du thème"
```

---

### Task 6: Écran 5 — Adresse du site / slug (renuméroté depuis l'ancien etape-3)

**Files:**
- Create: `src/app/onboarding/etape-5/page.tsx`
- Modify: `src/components/dashboard/onboarding-step3-form.tsx`

**Interfaces:**
- Consumes: `createWedding` avec `themeId` désormais accepté (Task 1), `OnboardingStep3Form`.
- Produces: à la création réussie du wedding, redirection vers `/onboarding/etape-6`.

- [ ] **Step 1: Créer `src/app/onboarding/etape-5/page.tsx`**

```tsx
import type { Metadata } from "next"
import { OnboardingStep3Form } from "@/components/dashboard/onboarding-step3-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 5" }

export default function OnboardingStep3Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={5} />
      <div className="space-y-2">
        <h1 className="text-3xl">Choisissez l&apos;adresse de votre site</h1>
        <p className="text-muted-foreground">
          Ce sera l&apos;URL que vous partagerez à vos invités.
        </p>
      </div>
      <OnboardingStep3Form />
    </div>
  )
}
```

- [ ] **Step 2: Inclure `themeId` dans l'appel `createWedding` et rediriger vers l'étape 6**

Dans `src/components/dashboard/onboarding-step3-form.tsx`, remplacer :

```ts
    const stored = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    const result = await createWedding({
      partner1FirstName: stored.partner1FirstName ?? "",
      partner2FirstName: stored.partner2FirstName ?? "",
      weddingDate: stored.weddingDate || undefined,
      slug: values.slug,
    })
```

par :

```ts
    const stored = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    const result = await createWedding({
      partner1FirstName: stored.partner1FirstName ?? "",
      partner2FirstName: stored.partner2FirstName ?? "",
      weddingDate: stored.weddingDate || undefined,
      themeId: stored.themeId || undefined,
      slug: values.slug,
    })
```

et remplacer :

```ts
    sessionStorage.removeItem("onboarding")
    router.push("/onboarding/etape-4")
```

par :

```ts
    sessionStorage.removeItem("onboarding")
    router.push("/onboarding/etape-6")
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, parcourir le flow complet depuis `/onboarding/etape-1` en choisissant le thème "Contemporain" à l'étape 4, jusqu'à la création du wedding.
Expected : wedding créé avec succès, redirection vers `/onboarding/etape-6`. Vérifier en base (ou via `/dashboard/site`) que `theme_id = 'contemporary'` a bien été appliqué.

- [ ] **Step 4: Commit**

```bash
git add "src/app/onboarding/etape-5/page.tsx" src/components/dashboard/onboarding-step3-form.tsx
git commit -m "feat(onboarding): renumérote l'écran slug en étape 5 et transmet le thème choisi"
```

---

### Task 7: Écran 6 — Confirmation (renuméroté depuis l'ancien etape-4)

**Files:**
- Create: `src/app/onboarding/etape-6/page.tsx`
- Modify: `src/components/dashboard/onboarding-complete-tracker.tsx` (commentaire uniquement)

**Interfaces:**
- Consumes: `OnboardingCompleteTracker` (inchangé), `OnboardingStepIndicator`.
- Produces: écran final du wizard, lien vers `/dashboard`.

- [ ] **Step 1: Créer `src/app/onboarding/etape-6/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"
import { OnboardingCompleteTracker } from "@/components/dashboard/onboarding-complete-tracker"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Votre site est prêt !" }

export default function OnboardingStep6Page() {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <OnboardingCompleteTracker />
      <OnboardingStepIndicator currentStep={6} />
      <div className="space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl">Votre site est prêt !</h1>
        <p className="text-muted-foreground">
          Commencez à personnaliser votre espace et partagez le lien avec vos invités.
        </p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/dashboard">Accéder à mon tableau de bord</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Mettre à jour le commentaire dans `onboarding-complete-tracker.tsx`**

Dans `src/components/dashboard/onboarding-complete-tracker.tsx`, remplacer :

```ts
// Monté uniquement sur /onboarding/etape-4, atteinte seulement après un
// createWedding réussi (redirect côté onboarding-step3-form.tsx) — la simple
// présence sur cette page suffit à signaler la conversion, pas de check
// supplémentaire nécessaire.
```

par :

```ts
// Monté uniquement sur /onboarding/etape-6, atteinte seulement après un
// createWedding réussi (redirect côté onboarding-step3-form.tsx) — la simple
// présence sur cette page suffit à signaler la conversion, pas de check
// supplémentaire nécessaire.
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, atteindre `/onboarding/etape-6` en fin de parcours.
Expected : indicateur affiche 6/6, message "Votre site est prêt !", clic redirige vers `/dashboard` et affiche la checklist (Task 8).

- [ ] **Step 4: Commit**

```bash
git add "src/app/onboarding/etape-6/page.tsx" src/components/dashboard/onboarding-complete-tracker.tsx
git commit -m "feat(onboarding): renumérote l'écran de confirmation en étape 6"
```

---

### Task 8: Checklist dashboard — réordonnancement et copy

**Files:**
- Modify: `src/components/dashboard/onboarding-checklist.tsx`

**Interfaces:**
- Consumes: aucune interface externe changée — `Props` (`wedding`, `hasGuests`, `hasGifts`), logique de complétion et `completeOnboardingChecklist` inchangées.
- Produces: aucun changement d'API, uniquement l'ordre d'affichage et le titre de la card.

- [ ] **Step 1: Réordonner le tableau `items` (item "share" en premier)**

Dans `src/components/dashboard/onboarding-checklist.tsx`, remplacer :

```ts
  const items = [
    {
      key: "hero",
      label: "Ajouter votre photo de couple",
      href: "/dashboard/site#cover" as Route,
      done: !!wedding.cover_image_url,
    },
    {
      key: "guests",
      label: "Ajouter vos premiers invités",
      href: "/dashboard/invites" as Route,
      done: hasGuests,
    },
    {
      key: "gifts",
      label: "Créer votre premier cadeau",
      href: "/dashboard/liste" as Route,
      done: hasGifts,
    },
    {
      key: "rsvp",
      label: "Activer le RSVP",
      href: "/dashboard/invites" as Route,
      done: wedding.rsvp_enabled,
    },
    { key: "share", label: "Partager votre lien avec vos proches", done: shared },
  ]
```

par :

```ts
  const items = [
    { key: "share", label: "Partager votre lien avec vos proches", done: shared },
    {
      key: "hero",
      label: "Ajouter votre photo de couple",
      href: "/dashboard/site#cover" as Route,
      done: !!wedding.cover_image_url,
    },
    {
      key: "guests",
      label: "Ajouter vos premiers invités",
      href: "/dashboard/invites" as Route,
      done: hasGuests,
    },
    {
      key: "gifts",
      label: "Créer votre premier cadeau",
      href: "/dashboard/liste" as Route,
      done: hasGifts,
    },
    {
      key: "rsvp",
      label: "Activer le RSVP",
      href: "/dashboard/invites" as Route,
      done: wedding.rsvp_enabled,
    },
  ]
```

- [ ] **Step 2: Changer le titre de la card**

Dans `src/components/dashboard/onboarding-checklist.tsx`, remplacer :

```tsx
      <CardHeader>
        <CardTitle className="text-base">Démarrer votre mariage</CardTitle>
        <p className="text-sm text-muted-foreground">{completedCount}/5 étapes complétées</p>
      </CardHeader>
```

par :

```tsx
      <CardHeader>
        <CardTitle className="text-base">Et maintenant ?</CardTitle>
        <p className="text-sm text-muted-foreground">{completedCount}/5 étapes complétées</p>
      </CardHeader>
```

- [ ] **Step 3: Vérification manuelle**

Run: `pnpm dev`, se connecter avec un compte dont le wedding n'a pas terminé l'onboarding (`onboarding_completed_at` null), ouvrir `/dashboard`.
Expected : card titrée "Et maintenant ?", premier item de la liste = "Partager votre lien avec vos proches" avec son bouton "Copier le lien", reste de la logique (coche verte sur les items complétés, disparition de la card une fois les 5 items faits) inchangée.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/onboarding-checklist.tsx
git commit -m "feat(dashboard): met en avant le partage du lien en tête de la checklist onboarding"
```

---

### Task 9: Vérification finale du parcours complet et push

**Files:** aucun (vérification uniquement)

- [ ] **Step 1: Lancer la suite de vérifications**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected : les trois commandes passent sans erreur.

- [ ] **Step 2: Parcours manuel complet, compte neuf**

Run: `pnpm dev`, créer un nouveau compte via `/inscription` (ou réinitialiser un compte de test sans wedding).
Expected : redirection automatique vers `/onboarding/etape-1` → parcours des 6 écrans (Bienvenue → Prénoms → Date → Thème → Slug → Confirmation) → arrivée sur `/dashboard` avec la checklist réordonnée affichée. Vérifier que le thème choisi apparaît bien sur `/m/[slug]` (couleur/typo cohérente avec le thème sélectionné).

- [ ] **Step 3: Push**

```bash
git push
```

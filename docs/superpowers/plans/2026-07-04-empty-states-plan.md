# Bloc 3 — Chantier 2 : Empty states scénarisés — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les empty states ad-hoc de `/dashboard/liste`, `/dashboard/budget` et `/dashboard/invites` par le composant `EmptyState` déjà partagé par `/dashboard/cagnotte` et `/dashboard/plan-de-table`, conformément à `docs/superpowers/specs/2026-07-04-empty-states-design.md`.

**Architecture:** Aucune nouvelle abstraction — chaque fichier remplace son `<div border-dashed>` existant par `<EmptyState icon=... title=... description=... action={{ label, onClick }} />`, où le CTA appelle exactement le même `setAddOpen(true)` déjà utilisé par le bouton "Ajouter" permanent de chaque composant. Ce bouton permanent est masqué quand la liste est réellement vide (pour éviter un double CTA), sauf pour `/dashboard/invites` où il reste visible en cas de filtre actif sans résultat (il y a des invités, juste filtrés).

**Tech Stack:** React 19 Client Components (`"use client"`, déjà en place dans les 3 fichiers), Tailwind, `lucide-react`, composant `EmptyState` existant (`src/components/ui/empty-state.tsx`, non modifié dans ce chantier).

## Global Constraints

- Composant `EmptyState` réutilisé tel quel (`src/components/ui/empty-state.tsx`) — ne pas le modifier, ne pas en créer un nouveau.
- Icônes : `Gift` (liste), `Wallet` (budget), `Users` (invites vide), `FilterX` (invites filtré) — toutes confirmées présentes dans `lucide-react` installé.
- Aucun changement de logique métier (filtrage, tri, drag-and-drop, suppression, appels serveur) — uniquement le remplacement du bloc vide et la visibilité conditionnelle du bouton permanent.
- Pas de framework de test au niveau composant dans ce repo (`vitest.config.ts` utilise `environment: "node"`, cf. CLAUDE.md §15 "Pas de test pour : composants UI purement présentationnels") — vérification par `pnpm typecheck` + `pnpm lint` + vérification manuelle.
- Commits en conventional commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`), un commit par tâche.
- Changements chirurgicaux uniquement — toucher exactement les lignes nécessaires dans chaque fichier, ne pas réorganiser le reste du composant.

---

### Task 1: `/dashboard/liste` — empty state cadeaux

**Files:**
- Modify: `src/components/dashboard/gift-list-editor.tsx`

**Interfaces:**
- Consumes: `EmptyState` (`@/components/ui/empty-state`, props `icon: LucideIcon`, `title: string`, `description?: string`, `action?: { label: string; href?: Route; onClick?: () => void }` — inchangé).
- Produces: aucune interface nouvelle exposée à d'autres fichiers (composant terminal, pas de props changées).

- [ ] **Step 1: Ajouter les imports nécessaires**

Dans `src/components/dashboard/gift-list-editor.tsx`, remplacer :

```tsx
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { sendGAEvent } from "@/lib/ga-client-event"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
```

par :

```tsx
import { Plus, Gift } from "lucide-react"
import { toast } from "sonner"
import { sendGAEvent } from "@/lib/ga-client-event"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
```

- [ ] **Step 2: Remplacer le bloc vide ad-hoc par `EmptyState`**

Remplacer :

```tsx
      {gifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">Aucun cadeau pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez votre premier cadeau pour commencer.
          </p>
        </div>
      ) : (
```

par :

```tsx
      {gifts.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Aucun cadeau pour l'instant."
          description="Créez votre premier cadeau pour que vos invités puissent commencer à contribuer."
          action={{ label: "Ajouter un cadeau", onClick: () => setAddOpen(true) }}
        />
      ) : (
```

- [ ] **Step 3: Masquer le bouton permanent quand la liste est vide**

Remplacer :

```tsx
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un cadeau
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
```

par :

```tsx
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        {gifts.length > 0 && (
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un cadeau
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
```

- [ ] **Step 4: Vérification**

Run: `pnpm typecheck && pnpm lint`
Expected: les deux commandes passent sans erreur.

Vérification manuelle : sur un wedding sans cadeau, `/dashboard/liste` affiche l'icône `Gift`, le titre, la description, et le bouton "Ajouter un cadeau" ouvre bien le dialog de création (le bouton "Ajouter un cadeau" permanent en bas ne doit plus apparaître). Après création d'un premier cadeau, le bouton permanent redevient visible.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/gift-list-editor.tsx
git commit -m "feat(dashboard): empty state scénarisé sur la liste de cadeaux"
```

---

### Task 2: `/dashboard/budget` — empty state postes budgétaires

**Files:**
- Modify: `src/components/dashboard/budget-editor.tsx`

**Interfaces:**
- Consumes: `EmptyState` (mêmes props que Task 1).
- Produces: aucune.

- [ ] **Step 1: Ajouter les imports nécessaires**

Dans `src/components/dashboard/budget-editor.tsx`, remplacer :

```tsx
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
```

par :

```tsx
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
```

- [ ] **Step 2: Remplacer le bloc vide ad-hoc par `EmptyState`**

Remplacer :

```tsx
      {grouped.length === 0 && !addOpen && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun poste budgétaire pour l&apos;instant.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Ajoutez votre premier poste pour commencer.
          </p>
        </div>
      )}
```

par :

```tsx
      {grouped.length === 0 && !addOpen && (
        <EmptyState
          icon={Wallet}
          title="Aucun poste budgétaire pour l'instant."
          description="Ajoutez vos postes de dépense pour suivre votre budget du jour J."
          action={{ label: "Ajouter un poste", onClick: () => setAddOpen(true) }}
        />
      )}
```

- [ ] **Step 3: Masquer le bouton permanent quand la liste est vide**

Remplacer :

```tsx
      {!addOpen && !editingItem && (
        <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un poste
        </Button>
      )}
```

par :

```tsx
      {!addOpen && !editingItem && grouped.length > 0 && (
        <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un poste
        </Button>
      )}
```

- [ ] **Step 4: Vérification**

Run: `pnpm typecheck && pnpm lint`
Expected: les deux commandes passent sans erreur.

Vérification manuelle : sur un wedding sans poste budgétaire, `/dashboard/budget` affiche l'icône `Wallet`, le titre, la description, et le bouton "Ajouter un poste" ouvre bien le formulaire inline (le bouton permanent en bas ne doit plus apparaître tant que la liste est vide). Après création d'un premier poste, le bouton permanent redevient visible.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/budget-editor.tsx
git commit -m "feat(dashboard): empty state scénarisé sur le budget mariage"
```

---

### Task 3: `/dashboard/invites` — empty states invités (vide + filtré)

**Files:**
- Modify: `src/components/dashboard/guest-editor.tsx`

**Interfaces:**
- Consumes: `EmptyState` (mêmes props que Task 1).
- Produces: une fonction interne `resetFilters(): void` (remplace la logique inline dupliquée du bouton de filtre existant).

- [ ] **Step 1: Ajouter les imports nécessaires**

Dans `src/components/dashboard/guest-editor.tsx`, remplacer :

```tsx
import { Plus, Pencil, Trash2, MailCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
```

par :

```tsx
import { Plus, Pencil, Trash2, MailCheck, Users, FilterX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
```

- [ ] **Step 2: Extraire `resetFilters()`**

Remplacer :

```tsx
  async function handleDelete(guestId: string) {
    const result = await deleteGuest(guestId)
    if (result.error) {
      toast.error("Erreur lors de la suppression.")
      return
    }
    toast.success("Invité supprimé", { duration: 3000 })
    router.refresh()
  }
```

par :

```tsx
  async function handleDelete(guestId: string) {
    const result = await deleteGuest(guestId)
    if (result.error) {
      toast.error("Erreur lors de la suppression.")
      return
    }
    toast.success("Invité supprimé", { duration: 3000 })
    router.refresh()
  }

  function resetFilters() {
    setFilterStatus("all")
    setFilterSide("all")
    setFilterGroup("")
  }
```

- [ ] **Step 3: Réutiliser `resetFilters()` dans le bouton de filtre existant**

Remplacer :

```tsx
        {(filterStatus !== "all" || filterSide !== "all" || filterGroup) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("all")
              setFilterSide("all")
              setFilterGroup("")
            }}
          >
            Réinitialiser
          </Button>
        )}
```

par :

```tsx
        {(filterStatus !== "all" || filterSide !== "all" || filterGroup) && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}
```

- [ ] **Step 4: Remplacer le bloc vide ad-hoc par deux `EmptyState` distincts**

Remplacer :

```tsx
      {filtered.length === 0 && !addOpen && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {guests.length === 0
              ? "Aucun invité pour l'instant."
              : "Aucun invité pour ces filtres."}
          </p>
        </div>
      )}
```

par :

```tsx
      {filtered.length === 0 && !addOpen && (
        guests.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun invité pour l'instant."
            description="Ajoutez vos premiers invités pour commencer à gérer votre liste et suivre les RSVP."
            action={{ label: "Ajouter un invité", onClick: () => setAddOpen(true) }}
          />
        ) : (
          <EmptyState
            icon={FilterX}
            title="Aucun invité pour ces filtres."
            description="Essayez d'élargir vos critères de recherche."
            action={{ label: "Réinitialiser les filtres", onClick: resetFilters }}
          />
        )
      )}
```

- [ ] **Step 5: Masquer le bouton permanent uniquement quand `guests.length === 0`**

Remplacer :

```tsx
      <div className="flex flex-wrap gap-3">
        {!addOpen && !editingGuest && (
          <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un invité
          </Button>
        )}
        <GuestCsvButtons weddingId={weddingId} />
      </div>
```

par :

```tsx
      <div className="flex flex-wrap gap-3">
        {!addOpen && !editingGuest && guests.length > 0 && (
          <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un invité
          </Button>
        )}
        <GuestCsvButtons weddingId={weddingId} />
      </div>
```

Note : `GuestCsvButtons` reste toujours visible, y compris à vide (import CSV utile pour ajouter des invités en masse).

- [ ] **Step 6: Vérification**

Run: `pnpm typecheck && pnpm lint`
Expected: les deux commandes passent sans erreur.

Vérification manuelle, deux cas :
1. Wedding sans invité du tout : `/dashboard/invites` affiche l'icône `Users`, le titre "Aucun invité pour l'instant.", et "Ajouter un invité" ouvre le formulaire. Le bouton permanent "Ajouter un invité" n'apparaît pas ; les boutons CSV restent visibles.
2. Wedding avec des invités mais un filtre actif qui ne retourne rien (ex. filtrer par statut "Décliné" alors qu'aucun invité n'a ce statut) : `/dashboard/invites` affiche l'icône `FilterX`, le titre "Aucun invité pour ces filtres.", et "Réinitialiser les filtres" vide bien les filtres et fait réapparaître la liste. Le bouton permanent "Ajouter un invité" reste visible dans ce cas (il y a des invités).

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/guest-editor.tsx
git commit -m "feat(dashboard): empty states scénarisés sur la liste d'invités (vide et filtré)"
```

---

### Task 4: Vérification finale

**Files:** aucun (vérification uniquement)

- [ ] **Step 1: Suite de vérifications complète**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck et lint passent sans erreur. `pnpm test` : les mêmes 2 suites pré-existantes et sans rapport (`tests/unit/actions/rsvp.test.ts`, `tests/unit/api/stripe-webhook.test.ts`) peuvent échouer pour une raison de configuration d'environnement de test déjà connue (non liée à ce chantier, cf. Bloc 3 chantier 1) — tous les autres tests doivent passer.

- [ ] **Step 2: Parcours manuel des 4 empty states**

Run: `pnpm dev` (sur un port libre si 3000 est occupé, ex. `pnpm exec next dev -p 3001`), se connecter avec un compte de test.
Expected : vider ou utiliser un wedding sans cadeau/poste budgétaire/invité pour vérifier les 3 empty states "vides" (`/dashboard/liste`, `/dashboard/budget`, `/dashboard/invites`), et vérifier le cas filtré sur `/dashboard/invites` avec un wedding qui a des invités.

- [ ] **Step 3: Push**

```bash
git push
```

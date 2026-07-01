# CLAUDE.md — Conventions techniques du projet

> À lire **avant** le SPEC.md fonctionnel. Ce fichier dicte le **comment** ; SPEC.md dicte le **quoi**.
> En cas de conflit entre une habitude de Claude Code et ce fichier, **ce fichier prime**. Aucune exception.

---

## 1. STACK — VERSIONS EXACTES

```
node           : >= 20.11 (LTS)
pnpm           : >= 9.0 (gestionnaire imposé, pas npm, pas yarn)
next           : ^16.2.9 (App Router uniquement, jamais Pages Router)
react          : ^19.0.0
typescript     : ^5.5 (strict: true, noUncheckedIndexedAccess: true)
tailwindcss    : ^3.4 (pas v4 tant que shadcn/ui n'est pas migré)
@supabase/ssr  : dernière version (jamais @supabase/auth-helpers, déprécié)
@clerk/nextjs  : dernière version compatible App Router
zod            : ^3.23
react-hook-form: ^7.52
date-fns       : ^3.6
```

**Lockfile committé**. Pas de `^` qui floate en prod : versions épinglées dans le lockfile.

---

## 2. STRUCTURE DE DOSSIERS

```
.
├── src/
│   ├── app/                          # App Router uniquement
│   │   ├── (marketing)/              # Route group landing/blog/légal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # /
│   │   │   ├── tarifs/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── ...
│   │   ├── (auth)/                   # Route group auth
│   │   │   ├── connexion/
│   │   │   └── inscription/
│   │   ├── (dashboard)/              # Route group privé (couple)
│   │   │   ├── layout.tsx            # Auth requise + sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── liste/page.tsx
│   │   │   ├── site/page.tsx
│   │   │   └── ...
│   │   ├── (public-wedding)/         # Site mariage public
│   │   │   └── m/[slug]/
│   │   │       ├── page.tsx
│   │   │       ├── contribuer/page.tsx
│   │   │       └── rsvp/[token]/page.tsx
│   │   ├── admin/                    # Back-office
│   │   ├── api/                      # Routes API (webhooks UNIQUEMENT)
│   │   │   └── webhooks/
│   │   │       ├── stripe/route.ts
│   │   │       └── clerk/route.ts
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (généré, ne pas modifier hors customisation thème)
│   │   ├── marketing/                # Composants pages publiques
│   │   ├── dashboard/                # Composants dashboard couple
│   │   ├── wedding-site/             # Composants du site public mariage
│   │   └── shared/                   # Composants transverses (Logo, Footer, etc.)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts             # createServerClient
│   │   │   ├── client.ts             # createBrowserClient
│   │   │   ├── middleware.ts         # session refresh
│   │   │   └── types.ts              # Types générés par `supabase gen types`
│   │   ├── clerk/
│   │   ├── resend/
│   │   │   ├── client.ts
│   │   │   └── templates/            # Templates React Email
│   │   ├── validators/               # Schémas Zod réutilisables
│   │   ├── constants.ts
│   │   ├── utils.ts                  # cn() + helpers transverses
│   │   └── env.ts                    # validation env vars avec Zod
│   ├── actions/                      # Server Actions (mutations)
│   │   ├── wedding.ts
│   │   ├── gifts.ts
│   │   ├── contributions.ts
│   │   ├── withdrawals.ts
│   │   └── ...
│   ├── queries/                      # Fonctions de lecture (Server Components)
│   │   ├── wedding.ts
│   │   ├── gifts.ts
│   │   └── ...
│   ├── hooks/                        # Hooks React (Client Components uniquement)
│   ├── types/                        # Types TS partagés (Database, domaine)
│   ├── i18n/                         # next-intl config + messages
│   │   ├── messages/
│   │   │   ├── fr.json
│   │   │   └── en.json
│   │   └── config.ts
│   └── middleware.ts                 # Clerk + Supabase + locale
├── supabase/
│   ├── migrations/                   # SQL versionné
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/                          # Playwright
├── public/
├── .env.local.example                # Toujours à jour, jamais .env.local committé
├── SPEC.md
├── CLAUDE.md
├── README.md
└── package.json
```

**Règle non négociable** : un dossier `pages/` n'existe pas. Si tu vois `getServerSideProps` ou `getStaticProps`, c'est un bug à corriger.

---

## 3. SERVER COMPONENTS PAR DÉFAUT

**Règle d'or Next.js 16** : un composant est **Server Component par défaut**. On n'ajoute `"use client"` que quand c'est strictement nécessaire (interactivité, hooks React, browser API).

### Quand `"use client"` est obligatoire
- Hooks React (`useState`, `useEffect`, `useReducer`, `useContext`, custom hooks)
- Event handlers (`onClick`, `onChange`)
- API browser (`window`, `document`, `localStorage`)
- Librairies qui dépendent de ces choses (Framer Motion sur composants animés, react-hook-form, certains composants Radix)

### Pattern systématique
- Le **layout** et la **page** restent Server Components → on y fait les `fetch` data
- On extrait l'interactivité dans des sous-composants `"use client"` ciblés
- On passe les données du Server au Client par props (sérialisables)

```tsx
// ✅ BON
// app/(dashboard)/liste/page.tsx (Server Component)
import { getGifts } from "@/queries/gifts"
import { GiftListEditor } from "@/components/dashboard/gift-list-editor"

export default async function ListePage() {
  const gifts = await getGifts()
  return <GiftListEditor initialGifts={gifts} />
}

// components/dashboard/gift-list-editor.tsx
"use client"
export function GiftListEditor({ initialGifts }: Props) {
  const [gifts, setGifts] = useState(initialGifts)
  // ...
}
```

```tsx
// ❌ INTERDIT
// Une page "use client" qui fetch en useEffect : tu perds tout l'intérêt de Next.js.
```

---

## 4. SERVER ACTIONS POUR LES MUTATIONS

**Toutes les mutations passent par des Server Actions**, jamais par `fetch('/api/...')` interne.

API Routes (`app/api/`) **uniquement** pour : webhooks externes (Stripe, Clerk), endpoints consommés par des tiers, cas où on a besoin d'un endpoint REST stable.

### Structure d'une Server Action

```ts
// src/actions/gifts.ts
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createServerClient } from "@/lib/supabase/server"

const createGiftSchema = z.object({
  weddingId: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  targetAmount: z.number().positive().max(50000),
  imageUrl: z.string().url().optional(),
})

export async function createGift(input: z.infer<typeof createGiftSchema>) {
  // 1. Auth
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" } as const

  // 2. Validation
  const parsed = createGiftSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() } as const

  // 3. Authorization (RLS s'en charge aussi mais on vérifie en amont)
  const supabase = createServerClient()
  // ... check user is coowner of wedding

  // 4. Mutation
  const { data, error } = await supabase.from("gifts").insert(parsed.data).select().single()
  if (error) return { error: "DB_ERROR", message: error.message } as const

  // 5. Revalidation
  revalidatePath(`/dashboard/liste`)
  revalidatePath(`/m/${weddingSlug}`)

  return { data } as const
}
```

**Patterns à respecter** :
- Toujours typer le retour avec `as const` pour discriminer success/error
- Toujours valider l'input avec Zod
- Toujours `revalidatePath` (ou `revalidateTag`) après mutation
- Jamais throw : retourner un objet `{ error }` discriminé
- Jamais exposer les détails d'erreur DB en clair au client

---

## 5. SUPABASE — DEUX CLIENTS, RÈGLES STRICTES

### Server-side (Server Components, Server Actions, Route Handlers)
```ts
import { createServerClient } from "@/lib/supabase/server"
const supabase = createServerClient() // Anon key + cookies → RLS appliquée
```

### Browser-side (Client Components, rare)
```ts
import { createBrowserClient } from "@/lib/supabase/client"
const supabase = createBrowserClient() // Anon key + cookies → RLS appliquée
```

### Service role (admin uniquement)
```ts
// JAMAIS importé hors d'un fichier en `/lib/supabase/admin.ts`
// JAMAIS exposé côté client
// Utilisé uniquement dans : webhooks, jobs cron, admin operations
```

### Règles RLS
- **Toutes les tables ont RLS activée**. Sans exception. Même les tables de log.
- Les policies sont versionnées dans `supabase/migrations/`.
- Toute nouvelle table sans RLS dans la même migration = PR refusée.
- Tester les policies : pour chaque table, un test E2E "user A ne voit pas les données de user B".

### Types DB
- Générer après chaque migration : `pnpm supabase gen types typescript --local > src/lib/supabase/types.ts`
- Ne **jamais** éditer ce fichier à la main.

---

## 6. CLERK — PATTERNS

### Middleware
```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
```

### Sync Clerk → Supabase
- Webhook Clerk `user.created` → insertion dans `public.users` avec `id = clerk_user_id`
- Webhook Clerk `user.updated` → update email/displayName
- Webhook Clerk `user.deleted` → soft delete (jamais hard delete d'un user qui a des contributions)

### Accès à l'utilisateur
- Server : `const { userId } = await auth()` puis lookup en DB si besoin du profil
- Client : `useUser()` de `@clerk/nextjs`

---

## 7. FORMULAIRES — STACK UNIQUE

Tous les formulaires : **react-hook-form + zod + Server Action**. Pas d'exception, pas de "juste un petit form".

```tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createGiftSchema } from "@/lib/validators/gifts"
import { createGift } from "@/actions/gifts"

export function CreateGiftForm() {
  const form = useForm({ resolver: zodResolver(createGiftSchema) })

  async function onSubmit(values: z.infer<typeof createGiftSchema>) {
    const result = await createGift(values)
    if ("error" in result) toast.error(...)
    else toast.success(...)
  }

  return <Form {...form}>...</Form>
}
```

- Composants `Form`, `FormField`, `FormItem` etc. viennent de shadcn/ui (`components/ui/form.tsx`)
- Le schéma Zod est **partagé** entre validator du form ET validator de la Server Action (single source of truth dans `/lib/validators/`)
- Les erreurs serveur sont remontées via `form.setError`

---

## 8. STYLING

### Tailwind d'abord
- Pas de fichiers CSS perso sauf `globals.css` (variables, reset, fontes)
- Pas de CSS Modules
- Pas de styled-components / Emotion

### Conventions Tailwind
- Utiliser `cn()` (de `lib/utils.ts`) pour les classes conditionnelles, jamais de concat avec template literals
- Classes ordonnées logiquement : layout → box → typo → couleurs → état (hover/focus). Le plugin Prettier `prettier-plugin-tailwindcss` est requis et trie automatiquement.
- Pas de magic numbers : utiliser les tokens du theme (`text-sm`, `gap-4`, etc.). Si un nombre exact est nécessaire, l'ajouter au `tailwind.config.ts`.

### Couleurs
- Définies en variables CSS dans `globals.css` (HSL pour shadcn/ui)
- Référencées par sémantique : `bg-background`, `text-foreground`, `border-input`, etc.
- Jamais `bg-purple-500` en dur dans le code applicatif.

### Responsive
- Mobile-first **toujours**. Pas de classes desktop sans breakpoint.
- Breakpoints : `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Pas de breakpoints custom sans très bonne raison.

---

## 9. ACCESSIBILITÉ — NON OPTIONNELLE

- Tous les composants interactifs ont un nom accessible (label, aria-label, aria-labelledby)
- Les images ont un `alt` pertinent (vide `alt=""` si décoratif uniquement)
- Le focus est visible (jamais `outline: none` sans remplacement)
- Les contrastes respectent WCAG AA (4.5:1 pour le texte normal, 3:1 pour le large)
- Navigation clavier complète (tab order logique, escape ferme les modales)
- Pas de `div onClick` sans rôle ARIA — utiliser `<button>`

CI : `pnpm test:a11y` lance axe-core sur les pages critiques.

---

## 10. PERFORMANCE — BUDGETS

| Métrique          | Cible           |
|-------------------|-----------------|
| LCP               | < 2.5s          |
| INP               | < 200ms         |
| CLS               | < 0.1           |
| JS first load     | < 150 KB gzip   |
| Image hero        | < 100 KB AVIF   |

- **Images** : toujours `next/image` avec `width`, `height`, `alt`. Format AVIF prioritaire, fallback WebP.
- **Fonts** : `next/font/google` ou `next/font/local`, `display: swap`.
- **Bundle** : surveiller avec `@next/bundle-analyzer`, lancé à chaque PR via CI.
- **Lazy loading** : composants lourds (éditeur, plan de table) en `dynamic()` avec `loading` skeleton.

---

## 11. ERROR HANDLING

### Server side
- Pas de `throw` non capturé dans les Server Actions / Route Handlers
- Erreurs métier → retour `{ error: "CODE", message?: "..." }`
- Erreurs inattendues → logger (Axiom/Logflare) + retour `{ error: "INTERNAL" }`
- Jamais leak de stack trace ou message DB au client

### Client side
- `error.tsx` à chaque niveau important du routing (au moins layout root + dashboard + public)
- Toasts pour les feedbacks utilisateur (Sonner via shadcn/ui)
- Sentry (ou équivalent) pour le monitoring d'erreurs en prod

### Boundaries
- `loading.tsx` à chaque route lente
- `not-found.tsx` personnalisé au layout root
- Suspense + skeletons partout où les données chargent > 200ms

---

## 12. ENV VARS — VALIDATION OBLIGATOIRE

```ts
// src/lib/env.ts
import { z } from "zod"

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // Private
  CLERK_SECRET_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  // ...
})

export const env = envSchema.parse(process.env)
```

- Import via `import { env } from "@/lib/env"`, jamais `process.env.X` directement.
- `.env.local.example` toujours à jour avec toutes les clés (valeurs vides ou placeholders).
- `.env.local` jamais committé.

---

## 13. NOMMAGE

| Élément              | Convention            | Exemple                   |
|----------------------|-----------------------|---------------------------|
| Fichiers composants  | kebab-case            | `gift-list-editor.tsx`    |
| Composants React     | PascalCase            | `GiftListEditor`          |
| Fonctions / vars     | camelCase             | `createGift`, `weddingId` |
| Constantes globales  | UPPER_SNAKE_CASE      | `MAX_GIFT_AMOUNT`         |
| Types & interfaces   | PascalCase            | `WeddingWithGifts`        |
| Schémas Zod          | camelCase + Schema    | `createGiftSchema`        |
| Tables Supabase      | snake_case pluriel    | `wedding_events`          |
| Colonnes Supabase    | snake_case            | `target_amount`           |
| Routes               | kebab-case            | `/comment-ca-marche`      |

---

## 14. GIT WORKFLOW

- Branche par défaut : `main`
- Branches feature : `feat/...`, `fix/...`, `chore/...`, `refactor/...`
- Commits en **conventional commits** : `feat(gifts): add drag and drop reorder`
- **Solo** : commit direct sur `main` autorisé, à condition que chaque commit soit
  atomique, bien nommé (conventional commits), et que le changement ait été
  testé/validé avant push.
- Passer en flux PR (branches feature + review) dès qu'un contributeur rejoint le
  projet ou qu'une CI bloquante est en place.
- PR : titre clair, description avec contexte + screenshots si UI + checklist (tests, types, accessibilité)
- Squash merge par défaut

---

## 15. TESTS

### Unit (Vitest)
- Tester les fonctions pures (`/lib`, validators, helpers métier)
- Tester chaque Server Action sur ses cas nominaux + erreurs auth + erreurs validation
- Coverage minimum 60% sur `/lib` et `/actions`

### E2E (Playwright)
- Flow critique #1 : inscription → onboarding → création wedding → publication site
- Flow critique #2 : invité arrive sur site → contribue à un cadeau → reçoit confirmation
- Flow critique #3 : couple demande retrait → KYC → payout en sandbox
- Lancés en CI sur chaque PR

### Pas de test pour
- Composants UI purement présentationnels (gain faible)
- Pages statiques sans logique

---

## 16. ANTI-PATTERNS — INTERDITS

- ❌ `any` en TypeScript (utiliser `unknown` + narrowing)
- ❌ `as` cast sans validation Zod préalable
- ❌ `useEffect` pour fetch côté client (utiliser Server Components)
- ❌ State management global (Zustand/Redux) — l'état serveur fait 95% du job
- ❌ Création d'une API Route REST quand une Server Action suffit
- ❌ Logique métier dans les composants (extraire dans `/actions` ou `/queries`)
- ❌ `console.log` en commit (sauf erreurs explicites, et encore : utiliser le logger)
- ❌ Édition manuelle de fichiers générés (types Supabase, shadcn/ui core)
- ❌ Dépendances ajoutées sans justification dans la PR
- ❌ Composants > 200 lignes : extraire en sous-composants
- ❌ Fonctions > 50 lignes : extraire

---

## 17. PROCESSUS DE TRAVAIL CLAUDE CODE

À chaque tâche reçue :

1. **Lire** SPEC.md + ce CLAUDE.md si pas déjà fait dans la session
2. **Annoncer** ce que tu vas faire en 3-5 lignes max avant de coder
3. **Coder** par petits commits logiques
4. **Vérifier** : `pnpm typecheck && pnpm lint && pnpm test` doit passer
5. **Récapituler** à la fin : ce qui a été fait, les trade-offs, les dettes techniques ouvertes

Si un point du SPEC.md ou de ce CLAUDE.md est ambigu pour la tâche en cours : **poser la question**, ne pas improviser silencieusement.

Si une convention de ce fichier est mal adaptée à un cas réel rencontré : **proposer une modification de ce fichier en PR**, ne pas la contourner.

---

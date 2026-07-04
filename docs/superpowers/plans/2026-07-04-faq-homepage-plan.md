# Bloc 3 — Chantier 3 : Section FAQ homepage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section FAQ de 9 questions à la homepage marketing (`src/app/(marketing)/page.tsx`), entre "Social proof / chiffres" et "CTA", conformément à `docs/superpowers/specs/2026-07-04-faq-homepage-design.md`.

**Architecture:** Une constante locale `FAQ_ITEMS` (même pattern que la constante `STATS` déjà présente dans ce fichier) + une nouvelle section JSX réutilisant le composant `Accordion` de shadcn/ui déjà utilisé sur `/faq` (aucune modification du composant). Section unique, non extraite dans un fichier séparé — pas de réutilisation ailleurs.

**Tech Stack:** Next.js 16 App Router, React 19 Server Component (page déjà un Server Component, pas de `"use client"` nécessaire — `Accordion` de shadcn/ui gère son propre état interne côté client via Radix), Tailwind.

## Global Constraints

- Ne pas modifier `src/app/(marketing)/faq/page.tsx` ni `src/components/ui/accordion.tsx`.
- 9 questions exactement, wording exact fourni dans le spec — ne pas paraphraser.
- Section insérée strictement entre "Social proof / chiffres" et "CTA", pas ailleurs.
- Accordéon plat (pas de regroupement par catégorie).
- Lien vers `/faq` en bas de section, style texte discret (pas un bouton).
- Pas de fond `bg-muted/50` sur cette section (la section CTA juste après en a déjà un — éviter deux fonds muted consécutifs).
- Pas de test automatisé pour cette page (page statique sans logique, cf. CLAUDE.md §15) — vérification par `pnpm typecheck` + `pnpm lint` + vérification manuelle.
- Commits en conventional commits, changements chirurgicaux uniquement.

---

### Task 1: Ajouter la section FAQ à la homepage

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` (`@/components/ui/accordion`, exports confirmés : `export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }`) ; `Link` (déjà importé dans ce fichier).
- Produces: aucune interface exposée à d'autres fichiers (page terminale).

- [ ] **Step 1: Ajouter l'import du composant Accordion**

Dans `src/app/(marketing)/page.tsx`, remplacer :

```tsx
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
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
```

- [ ] **Step 2: Insérer la section FAQ entre Social proof et CTA**

Remplacer :

```tsx
      {/* Social proof / chiffres */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
```

par :

```tsx
      {/* Social proof / chiffres */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl">Questions fréquentes</h2>
          <div className="mx-auto max-w-2xl">
            <Accordion type="multiple" className="rounded-lg border">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="px-4 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                >
                  <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/faq" className="underline underline-offset-4 hover:text-foreground">
                Voir toutes les questions →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
```

- [ ] **Step 3: Ajouter la constante `FAQ_ITEMS`**

Dans `src/app/(marketing)/page.tsx`, remplacer :

```tsx
const STATS = [
  { value: "2 min", label: "pour créer votre site" },
  { value: "0 €", label: "d'abonnement" },
  { value: "2,9 %", label: "de commission par transaction" },
]
```

par :

```tsx
const STATS = [
  { value: "2 min", label: "pour créer votre site" },
  { value: "0 €", label: "d'abonnement" },
  { value: "2,9 %", label: "de commission par transaction" },
]

const FAQ_ITEMS = [
  {
    q: "Comment créer mon site mariage avec Marryslate ?",
    a: "Inscrivez-vous gratuitement, renseignez les prénoms et la date, et votre site est en ligne en quelques minutes. Vous personnalisez ensuite tout depuis votre tableau de bord.",
  },
  {
    q: "Combien de temps faut-il pour créer le site ?",
    a: "Le site de base est prêt en moins de 5 minutes. Comptez 30 minutes à 1 heure pour l'enrichir avec votre histoire, vos photos et le programme de la journée.",
  },
  {
    q: "Comment fonctionne la liste de cadeaux ?",
    a: "Vous créez des cadeaux avec un montant cible, vos invités contribuent librement par carte bancaire. Dès qu'un cadeau est financé, il est marqué comme tel sur votre site.",
  },
  {
    q: "Combien ça coûte ?",
    a: "C'est gratuit. Aucun abonnement, aucun frais caché. Seule une commission de 2,9 % + 0,30 € est prélevée par contribution reçue — elle couvre les frais de paiement et le service.",
  },
  {
    q: "Dans quel délai recevons-nous les fonds ?",
    a: "Les fonds sont disponibles sous 2 à 7 jours ouvrés après chaque paiement. Vous demandez le virement vers votre IBAN quand vous voulez.",
  },
  {
    q: "Le paiement est-il sécurisé ?",
    a: "Oui. Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1. Marryslate ne stocke jamais les données bancaires de vos invités.",
  },
  {
    q: "Comment les invités participent-ils à la liste de cadeaux ?",
    a: "Ils accèdent à votre site via le lien que vous partagez, choisissent un cadeau ou une contribution libre, et paient par carte. Aucun compte Marryslate n'est nécessaire.",
  },
  {
    q: "Peut-on modifier le site après sa publication ?",
    a: "Oui, à tout moment. Textes, photos, cadeaux, infos pratiques — tout reste modifiable, avec une mise à jour visible en moins de 60 secondes.",
  },
  {
    q: "Comment fonctionne le RSVP ?",
    a: "Activez-le en un clic depuis votre tableau de bord. Vos invités indiquent leur présence, le nombre d'accompagnants et leurs restrictions alimentaires directement sur votre site.",
  },
]
```

- [ ] **Step 4: Vérification**

Run: `pnpm typecheck && pnpm lint`
Expected: les deux commandes passent sans erreur.

Vérification manuelle : `pnpm dev` (sur un port libre, ex. `pnpm exec next dev -p 3001` si 3000 est occupé), ouvrir `/`. La section "Questions fréquentes" apparaît entre les chiffres et le CTA final, avec 9 questions cliquables qui se déplient/replient, et le lien "Voir toutes les questions →" mène vers `/faq`. Vérifier aussi en largeur mobile (pas de débordement horizontal).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(marketing)/page.tsx"
git commit -m "feat(marketing): ajoute une section FAQ à la homepage"
```

---

### Task 2: Vérification finale et push

**Files:** aucun (vérification uniquement)

- [ ] **Step 1: Suite de vérifications complète**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck et lint passent sans erreur. `pnpm test` : les mêmes 2 suites pré-existantes et sans rapport (`tests/unit/actions/rsvp.test.ts`, `tests/unit/api/stripe-webhook.test.ts`) peuvent échouer pour une raison de configuration d'environnement déjà connue (Bloc 3, chantiers 1 et 2) — tous les autres tests doivent passer.

- [ ] **Step 2: Vérification manuelle finale**

Run: `pnpm dev` (ou `pnpm exec next dev -p 3001`)
Expected : parcours visuel complet de la homepage, confirmer que la section FAQ s'intègre sans rupture visuelle avec Social proof et CTA, en desktop et mobile.

- [ ] **Step 3: Push**

```bash
git push
```

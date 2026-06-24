import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Amora est gratuit à créer. Seulement 2,9 % + 0,30 € par contribution reçue. Aucun abonnement.",
}

const INCLUDED = [
  "Site de mariage personnalisé",
  "Liste de cadeaux illimitée",
  "Cagnotte libre",
  "Deux thèmes visuels",
  "Partage par lien",
  "Tableau de bord couple",
  "Retraits bancaires illimités",
  "Support par email",
]

export default function TarifsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl sm:text-5xl">Tarifs simples et transparents</h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Créez votre site gratuitement. Nous prélevons uniquement une commission sur les
          contributions reçues — vous ne payez rien si vous ne collectez rien.
        </p>
      </div>

      {/* Pricing card */}
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Formule unique
          </p>
          <p className="mt-2 text-5xl font-semibold">Gratuit</p>
          <p className="mt-1 text-muted-foreground">pour créer et publier</p>
        </div>

        <div className="mb-8 rounded-xl bg-muted/60 p-4 text-center">
          <p className="text-sm text-muted-foreground">Commission par contribution reçue</p>
          <p className="mt-1 text-2xl font-semibold">2,9 % + 0,30 €</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Déduit automatiquement. Vos invités voient et paient le montant qu&apos;ils choisissent.
          </p>
        </div>

        <ul className="mb-8 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <Button asChild className="w-full" size="lg">
          <Link href="/inscription">Créer mon site gratuitement</Link>
        </Button>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="mb-8 text-center text-2xl">Questions fréquentes</h2>
        <dl className="mx-auto max-w-2xl space-y-6">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

const FAQ = [
  {
    q: "Que se passe-t-il si je ne reçois aucune contribution ?",
    a: "Vous ne payez rien. La commission ne s'applique que sur les contributions effectivement reçues et confirmées.",
  },
  {
    q: "Qui paie la commission — moi ou mes invités ?",
    a: "La commission est déduite du montant net que vous recevez. Vos invités voient et paient le montant qu'ils ont choisi, sans surprise.",
  },
  {
    q: "Quand puis-je retirer les fonds ?",
    a: "Quand vous voulez, dès que votre compte bancaire est configuré via Stripe. Les retraits apparaissent sur votre compte sous 1 à 3 jours ouvrés.",
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non. Pas d'abonnement, pas de frais d'installation, pas de frais de retrait. Seulement la commission de 2,9 % + 0,30 € par transaction.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Les paiements sont traités par Stripe, certifié PCI-DSS niveau 1. Amora ne stocke jamais vos coordonnées bancaires.",
  },
]

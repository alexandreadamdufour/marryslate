import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, X, Minus } from "lucide-react"

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Marryslate est 100 % gratuit à créer. Seulement 2,9 % + 0,30 € par contribution reçue. Zéro abonnement, zéro frais caché. Vos invités contribuent en 2 clics.",
}

const INCLUDED = [
  "Site de mariage personnalisé",
  "Liste de cadeaux illimitée",
  "Cagnotte libre",
  "Deux thèmes visuels",
  "Partage par lien unique",
  "Tableau de bord en temps réel",
  "Retraits bancaires illimités",
  "Support par chat et email",
]

type CellValue = { type: "check" | "cross" | "dash" | "text"; text?: string }

const COMPARISON: {
  feature: string
  amora: CellValue
  milleMercis: CellValue
  unGrandJour: CellValue
}[] = [
  {
    feature: "Inscription",
    amora: { type: "text", text: "Gratuit" },
    milleMercis: { type: "text", text: "Gratuit" },
    unGrandJour: { type: "text", text: "Gratuit" },
  },
  {
    feature: "Commission par contribution",
    amora: { type: "text", text: "2,9 % + 0,30 €" },
    milleMercis: { type: "text", text: "1 % + 0,30 €" },
    unGrandJour: { type: "text", text: "2,9 % (Stripe)" },
  },
  {
    feature: "Abonnement mensuel",
    amora: { type: "text", text: "Aucun" },
    milleMercis: { type: "text", text: "Oui (requis)" },
    unGrandJour: { type: "text", text: "Aucun" },
  },
  {
    feature: "Site de mariage inclus",
    amora: { type: "check" },
    milleMercis: { type: "cross" },
    unGrandJour: { type: "check" },
  },
  {
    feature: "Retraits bancaires",
    amora: { type: "text", text: "Illimités & gratuits" },
    milleMercis: { type: "text", text: "Payants" },
    unGrandJour: { type: "text", text: "Illimités" },
  },
  {
    feature: "Frais cachés",
    amora: { type: "text", text: "Aucun" },
    milleMercis: { type: "text", text: "Abonnement + retraits" },
    unGrandJour: { type: "dash" },
  },
]

const SIMULATIONS = [
  { label: "Petit budget", collected: "2 000 €", commission: "58,30 €", received: "1 941,70 €" },
  { label: "Budget moyen", collected: "5 000 €", commission: "145,30 €", received: "4 854,70 €" },
  { label: "Grand budget", collected: "10 000 €", commission: "290,30 €", received: "9 709,70 €" },
]

const FAQ = [
  {
    q: "Que se passe-t-il si je ne reçois aucune contribution ?",
    a: "Vous ne payez absolument rien. La commission ne s'applique que sur les contributions effectivement reçues et confirmées par Stripe.",
  },
  {
    q: "Qui paie la commission — moi ou mes invités ?",
    a: "La commission est déduite du montant net que vous recevez. Vos invités voient et paient le montant qu'ils ont choisi, sans surprise ni frais supplémentaire de leur côté.",
  },
  {
    q: "Quand puis-je retirer les fonds ?",
    a: "Quand vous voulez, dès que votre compte bancaire est configuré. Les fonds apparaissent sur votre compte sous 1 à 3 jours ouvrés, sans frais.",
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non. Pas d'abonnement, pas de frais d'installation, pas de frais de retrait. Seulement la commission de 2,9 % + 0,30 € par transaction Stripe.",
  },
  {
    q: "Les paiements de mes invités sont-ils sécurisés ?",
    a: "Les paiements sont traités par Stripe, certifié PCI-DSS niveau 1. Marryslate ne stocke jamais les coordonnées bancaires de vos invités ni les vôtres.",
  },
]

function ComparisonCell({ value }: { value: CellValue }) {
  if (value.type === "check")
    return <Check className="mx-auto h-5 w-5 text-primary" aria-label="Oui" />
  if (value.type === "cross")
    return <X className="mx-auto h-5 w-5 text-muted-foreground/60" aria-label="Non" />
  if (value.type === "dash")
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Non communiqué" />
  return <span>{value.text}</span>
}

export default function TarifsPage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
          Tarifs
        </p>
        <h1 className="mb-6 text-4xl leading-tight sm:text-5xl md:text-6xl">
          Vous ne payez que quand{" "}
          <span className="text-primary">vous recevez un cadeau</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Inscription gratuite. Aucun abonnement. Aucun frais caché. Une seule commission de
          2,9&nbsp;% + 0,30&nbsp;€ par contribution — déduite automatiquement à la réception.
        </p>
      </section>

      {/* Pricing card */}
      <section className="container mx-auto px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-md rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              Formule unique
            </span>
          </div>

          <div className="mb-8 text-center">
            <p className="text-5xl font-semibold">Gratuit</p>
            <p className="mt-2 text-muted-foreground">à l&apos;inscription et à la publication</p>
          </div>

          <div className="mb-8 rounded-xl bg-muted/60 px-6 py-5 text-center">
            <p className="text-sm text-muted-foreground">Par contribution reçue</p>
            <p className="mt-1 text-3xl font-semibold">2,9&nbsp;% + 0,30&nbsp;€</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Déduits de votre côté. Vos invités ne voient aucun frais supplémentaire.
            </p>
          </div>

          <ul className="mb-8 space-y-3" aria-label="Ce qui est inclus">
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
      </section>

      {/* Simulation */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-3 text-center text-3xl">Ce que vous touchez réellement</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Exemples sur la base de 2,9&nbsp;% + 0,30&nbsp;€ par transaction
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {SIMULATIONS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-6 shadow-sm">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-xl font-semibold">{s.collected}</p>
                <p className="mb-1 mt-1 text-xs text-muted-foreground">collectés</p>
                <div className="my-4 border-t border-border/50" />
                <p className="text-sm text-muted-foreground">
                  Commission&nbsp;:{" "}
                  <span className="font-medium text-foreground">{s.commission}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vous recevez&nbsp;:{" "}
                  <span className="font-semibold text-primary">{s.received}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Calcul indicatif. Vérifiez les tarifs Stripe en vigueur sur stripe.com/fr.
          </p>
        </div>
      </section>

      {/* Comparatif */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-3 text-center text-3xl">Comparatif</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Marryslate face aux autres plateformes françaises
          </p>

          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                    Critère
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="font-semibold text-primary">Marryslate</span>
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                    MilleMercis
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">
                    Un Grand Jour
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-6 py-4 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-center font-medium text-foreground">
                      <ComparisonCell value={row.amora} />
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      <ComparisonCell value={row.milleMercis} />
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      <ComparisonCell value={row.unGrandJour} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Informations relevées publiquement. Vérifiez les tarifs officiels de chaque service.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl">Questions fréquentes</h2>
          <dl className="space-y-8">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="border-b border-border/60 pb-8 last:border-0 last:pb-0"
              >
                <dt className="mb-2 font-medium">{item.q}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-xl text-center sm:px-6">
          <h2 className="mb-4 text-3xl">Prêt·e à commencer ?</h2>
          <p className="mb-8 text-muted-foreground">
            Création en 2 minutes. Aucune carte bancaire requise.
          </p>
          <Button asChild size="lg">
            <Link href="/inscription">Créer mon site gratuitement</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

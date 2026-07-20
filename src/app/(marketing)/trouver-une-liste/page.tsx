import type { Metadata } from "next"
import Link from "next/link"
import { searchWeddings } from "@/actions/search"
import { WeddingSearch } from "@/components/marketing/wedding-search"

export const metadata: Metadata = {
  title: "Trouver une liste de mariage — Marryslate",
  description:
    "Retrouvez facilement le site de mariage de vos proches et contribuez à leur liste de cadeaux. Recherchez par prénom des mariés pour trouver leur site Marryslate.",
  openGraph: {
    title: "Trouver une liste de mariage — Marryslate",
    description: "Retrouvez le site de mariage de vos proches et contribuez à leur liste.",
  },
}

export default async function TrouverUneListePage() {
  const initial = await searchWeddings("", 1)
  const initialResults = initial.data ?? []
  const initialCount = initial.count ?? 0

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl">Trouver une liste de mariage</h1>
        <p className="mt-3 text-muted-foreground">
          Recherchez le site de mariage de vos proches par prénom.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Les sites Marryslate ne sont pas indexés sur Google : seules les personnes qui connaissent
          le lien direct ou passent par cette recherche peuvent y accéder. Si un couple que vous
          connaissez a créé sa liste avec Marryslate, tapez leurs prénoms ci-dessous pour retrouver
          leur site et contribuer à leurs cadeaux. Vous organisez votre propre mariage ?{" "}
          <Link
            href="/comment-ca-marche"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Créez votre site en 2 minutes
          </Link>
          .
        </p>
      </div>
      <WeddingSearch initialResults={initialResults} initialCount={initialCount} />
    </div>
  )
}

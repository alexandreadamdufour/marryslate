import type { Metadata } from "next"
import { searchWeddings } from "@/actions/search"
import { WeddingSearch } from "@/components/marketing/wedding-search"

export const metadata: Metadata = {
  title: "Trouver une liste de mariage — Amora",
  description:
    "Retrouvez facilement le site de mariage de vos proches et contribuez à leur liste de cadeaux. Recherchez par prénom des mariés pour trouver leur site Amora.",
  openGraph: {
    title: "Trouver une liste de mariage — Amora",
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
      </div>
      <WeddingSearch initialResults={initialResults} initialCount={initialCount} />
    </div>
  )
}

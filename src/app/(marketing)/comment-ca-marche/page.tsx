import type { Metadata } from "next"

export const metadata: Metadata = { title: "Comment ça marche" }

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-4xl">Comment ça marche</h1>
      <p className="text-muted-foreground">Contenu à venir — Sprint 4.</p>
    </div>
  )
}

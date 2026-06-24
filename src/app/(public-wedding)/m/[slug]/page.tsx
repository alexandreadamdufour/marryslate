import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getWeddingBySlug } from "@/queries/wedding"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = await getWeddingBySlug(slug)
  if (!wedding) return { title: "Page introuvable" }

  return {
    title: `Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
    description: `Site de mariage de ${wedding.partner1_first_name} et ${wedding.partner2_first_name}.`,
  }
}

export default async function WeddingPublicPage({ params }: Props) {
  const { slug } = await params
  const wedding = await getWeddingBySlug(slug)

  if (!wedding) notFound()

  return (
    <main>
      {/* Hero — Sprint 2 */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-4xl sm:text-6xl">
          {wedding.partner1_first_name} & {wedding.partner2_first_name}
        </h1>
        {wedding.wedding_date && (
          <p className="text-lg text-muted-foreground">
            {new Date(wedding.wedding_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        <p className="mt-8 text-sm text-muted-foreground">
          Le site de mariage complet arrive bientôt — Sprint 2.
        </p>
      </section>
    </main>
  )
}

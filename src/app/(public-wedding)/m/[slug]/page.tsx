import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getWeddingPublicData } from "@/queries/wedding"
import { WeddingHero } from "@/components/wedding-site/wedding-hero"
import { WeddingStory } from "@/components/wedding-site/wedding-story"
import { WeddingEventsSection } from "@/components/wedding-site/wedding-events-section"
import { WeddingGiftsSection } from "@/components/wedding-site/wedding-gifts-section"

// ISR : revalidation toutes les 60 secondes
export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = await getWeddingPublicData(slug)
  if (!wedding) return { title: "Page introuvable" }

  const title = `Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`

  return {
    title,
    description: `Site de mariage de ${wedding.partner1_first_name} et ${wedding.partner2_first_name}.`,
    openGraph: {
      title,
      images: wedding.cover_image_url ? [{ url: wedding.cover_image_url }] : [],
    },
  }
}

export default async function WeddingPublicPage({ params }: Props) {
  const { slug } = await params
  const wedding = await getWeddingPublicData(slug)

  if (!wedding) notFound()

  // theme_id peut être "classic" ou "contemporary" (valeurs de WEDDING_THEMES dans constants.ts)
  const themeClass =
    wedding.theme_id === "contemporary" ? "theme-contemporary" : "theme-classic"

  return (
    <div className={themeClass}>
      <WeddingHero wedding={wedding} />

      {wedding.story_md && <WeddingStory storyMd={wedding.story_md} />}

      <WeddingEventsSection events={wedding.events} />

      <WeddingGiftsSection gifts={wedding.gifts} weddingSlug={slug} />

      {/* Footer minimal */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          Créé avec{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Amora
          </Link>
        </p>
      </footer>
    </div>
  )
}

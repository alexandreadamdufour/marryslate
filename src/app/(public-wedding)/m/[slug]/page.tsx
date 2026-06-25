import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getWeddingPublicData } from "@/queries/wedding"
import { WeddingHero } from "@/components/wedding-site/wedding-hero"
import { WeddingStory } from "@/components/wedding-site/wedding-story"
import { WeddingEventsSection } from "@/components/wedding-site/wedding-events-section"
import { WeddingGiftsSection } from "@/components/wedding-site/wedding-gifts-section"
import { WeddingRsvpSection } from "@/components/wedding-site/wedding-rsvp-section"

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

  const description = `Site de mariage de ${wedding.partner1_first_name} et ${wedding.partner2_first_name}. Retrouvez toutes les informations et participez à leur liste de cadeaux.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      images: wedding.cover_image_url
        ? [{ url: wedding.cover_image_url, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function WeddingPublicPage({ params }: Props) {
  const { slug } = await params
  const wedding = await getWeddingPublicData(slug)

  if (!wedding) notFound()

  const themeClass =
    wedding.theme_id === "contemporary" ? "theme-contemporary" : "theme-classic"

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr"
  const pageUrl = `${baseUrl}/m/${slug}`
  const eventName = `Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventName,
    url: pageUrl,
    ...(wedding.wedding_date && { startDate: wedding.wedding_date }),
    ...(wedding.cover_image_url && { image: wedding.cover_image_url }),
    organizer: {
      "@type": "Person",
      name: `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
    },
    offers: wedding.gifts.length > 0
      ? {
          "@type": "Offer",
          url: `${pageUrl}/contribuer`,
          availability: "https://schema.org/InStock",
          priceCurrency: "EUR",
        }
      : undefined,
  }

  return (
    <div className={themeClass}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <WeddingHero wedding={wedding} />

      {wedding.story_md && <WeddingStory storyMd={wedding.story_md} />}

      <WeddingEventsSection events={wedding.events} />

      <WeddingGiftsSection gifts={wedding.gifts} weddingSlug={slug} />

      {wedding.rsvp_enabled && (
        <WeddingRsvpSection
          weddingId={wedding.id}
          partner1={wedding.partner1_first_name}
          partner2={wedding.partner2_first_name}
        />
      )}

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

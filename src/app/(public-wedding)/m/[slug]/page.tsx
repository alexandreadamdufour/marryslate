import { notFound } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import { getWeddingPublicData } from "@/queries/wedding"
import { getGuestbookMessages } from "@/queries/guestbook"
import { getTimelineSteps } from "@/queries/timeline"
import { hexToCssHsl, hexGetForeground } from "@/lib/utils"
import { getWeddingFontCss } from "@/lib/constants"
import { env } from "@/lib/env"
import { AccessGate } from "@/components/wedding-site/access-gate"
import { WeddingHero } from "@/components/wedding-site/wedding-hero"
import { WeddingStory } from "@/components/wedding-site/wedding-story"
import { WeddingEventsSection } from "@/components/wedding-site/wedding-events-section"
import { WeddingPracticalInfoSection } from "@/components/wedding-site/wedding-practical-info-section"
import { WeddingAccommodationsSection } from "@/components/wedding-site/wedding-accommodations-section"
import { WeddingGiftsSection } from "@/components/wedding-site/wedding-gifts-section"
import { WeddingTimelineSection } from "@/components/wedding-site/wedding-timeline-section"
import { ViewTracker } from "@/components/wedding-site/view-tracker"
import type { PracticalInfo } from "@/lib/validators/practical-info"

const WeddingRsvpSection = dynamic(() =>
  import("@/components/wedding-site/wedding-rsvp-section").then((m) => m.WeddingRsvpSection),
)

const WeddingGuestbookSection = dynamic(() =>
  import("@/components/wedding-site/wedding-guestbook-section").then(
    (m) => m.WeddingGuestbookSection,
  ),
)

// ISR : revalidation toutes les 60 secondes
export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = await getWeddingPublicData(slug)
  if (!wedding) return { title: "Page introuvable" }

  const isProtected = wedding.access_code_enabled && !!wedding.access_code

  const title = `Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
  const description = `Site de mariage de ${wedding.partner1_first_name} et ${wedding.partner2_first_name}. Retrouvez toutes les informations et participez à leur liste de cadeaux.`

  return {
    title,
    description,
    ...(isProtected && { robots: { index: false, follow: false } }),
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

  // Access code gate — calling cookies() here opts this render into dynamic mode
  // (ISR cache is only used when access_code_enabled is false)
  if (wedding.access_code_enabled && wedding.access_code) {
    const cookieStore = await cookies()
    const accessCookie = cookieStore.get(`amora_access_${slug}`)
    if (accessCookie?.value !== wedding.access_code) {
      return (
        <AccessGate
          weddingSlug={slug}
          partner1={wedding.partner1_first_name}
          partner2={wedding.partner2_first_name}
        />
      )
    }
  }

  const [guestbookMessages, timelineSteps] = await Promise.all([
    getGuestbookMessages(wedding.id),
    getTimelineSteps(wedding.id),
  ])

  const themeClass =
    wedding.theme_id === "contemporary" ? "theme-contemporary" : "theme-classic"

  // Inject per-wedding CSS variables to override theme defaults
  const weddingStyle: React.CSSProperties & Record<string, string> = {}
  if (wedding.primary_color) {
    const hsl = hexToCssHsl(wedding.primary_color)
    if (hsl) {
      weddingStyle["--primary"] = hsl
      weddingStyle["--ring"] = hsl
      weddingStyle["--primary-foreground"] = hexGetForeground(wedding.primary_color)
    }
  }
  if (wedding.font_family) {
    weddingStyle["--wedding-font"] = getWeddingFontCss(wedding.font_family)
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL
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
    <div className={themeClass} style={weddingStyle}>
      <script
        type="application/ld+json"
        // '<' échappé en < : partner1/2_first_name sont du texte libre non
        // restreint (Zod max(50) sans regex) et pourraient casser la balise
        // </script> si JSON.stringify() n'était pas échappé. Sémantiquement
        // neutre pour un parseur JSON-LD (Google le décode normalement).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaOrg).replace(/</g, "\\u003c"),
        }}
      />
      <WeddingHero wedding={wedding} />

      {wedding.story_md && (
        <WeddingStory
          title={wedding.story_title}
          text={wedding.story_md}
          images={(wedding.story_images as string[] | null) ?? []}
        />
      )}

      <WeddingEventsSection events={wedding.events} />

      <WeddingAccommodationsSection
        accommodations={(wedding.practical_info as PracticalInfo | null)?.accommodations}
      />

      <WeddingPracticalInfoSection
        info={wedding.practical_info as PracticalInfo | null}
      />

      <WeddingGiftsSection gifts={wedding.gifts} weddingSlug={slug} />

      <WeddingTimelineSection
        steps={timelineSteps}
        weddingDate={wedding.wedding_date}
        weddingSlug={slug}
        location={
          (wedding.practical_info as PracticalInfo | null)?.venue_ceremony
            ? [
                (wedding.practical_info as PracticalInfo | null)?.venue_ceremony?.name,
                (wedding.practical_info as PracticalInfo | null)?.venue_ceremony?.address,
              ]
                .filter(Boolean)
                .join(", ") || undefined
            : undefined
        }
      />

      {wedding.rsvp_enabled && (
        <WeddingRsvpSection
          weddingId={wedding.id}
          partner1={wedding.partner1_first_name}
          partner2={wedding.partner2_first_name}
        />
      )}

      <WeddingGuestbookSection
        weddingId={wedding.id}
        partner1={wedding.partner1_first_name}
        partner2={wedding.partner2_first_name}
        initialMessages={guestbookMessages}
      />

      {/* Footer minimal */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          Créé avec{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Marryslate
</Link>
        </p>
      </footer>

      <ViewTracker weddingSlug={slug} />
    </div>
  )
}

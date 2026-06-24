import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getWeddingPublicData } from "@/queries/wedding"
import { ContributionForm } from "@/components/wedding-site/contribution-form"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ gift?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = await getWeddingPublicData(slug)
  if (!wedding) return { title: "Page introuvable" }
  return {
    title: `Contribuer — Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
  }
}

export default async function ContribuerPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { gift: giftIdParam } = await searchParams

  const wedding = await getWeddingPublicData(slug)
  if (!wedding) notFound()

  const themeClass =
    wedding.theme_id === "contemporary" ? "theme-contemporary" : "theme-classic"

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const successUrl = `${baseUrl}/m/${slug}/contribuer/success`

  const selectedGift =
    giftIdParam && wedding.gifts.find((g) => g.id === giftIdParam) ? giftIdParam : null

  return (
    <div className={themeClass}>
      <div className="min-h-screen bg-background py-16">
        <div className="mx-auto max-w-lg px-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href={`/m/${slug}`}
              className="mb-6 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              ← Retour au site
            </Link>
            <h1 className="text-3xl">
              Mariage de {wedding.partner1_first_name} &amp; {wedding.partner2_first_name}
            </h1>
            <p className="mt-2 text-muted-foreground">Contribuez à leur liste de cadeaux</p>
          </div>

          {/* Form card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            {!wedding.stripe_account_id ? (
              <Alert>
                <AlertDescription>
                  Les paiements ne sont pas encore activés pour ce mariage. Revenez plus tard !
                </AlertDescription>
              </Alert>
            ) : (
              <ContributionForm
                gifts={wedding.gifts}
                defaultGiftId={selectedGift}
                weddingSlug={slug}
                successUrl={successUrl}
              />
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Paiement sécurisé par Stripe. Amora ne stocke aucune donnée bancaire.
          </p>
        </div>
      </div>
    </div>
  )
}

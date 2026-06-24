import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Gift } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Gift as GiftType } from "@/queries/gifts"

interface WeddingGiftsSectionProps {
  gifts: GiftType[]
  weddingSlug: string
}

function GiftCard({ gift, weddingSlug }: { gift: GiftType; weddingSlug: string }) {
  const percent = Math.min(
    100,
    Math.round((Number(gift.current_amount) / Number(gift.target_amount)) * 100)
  )
  const isFunded = percent >= 100

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {isFunded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-foreground">
              ✓ Financé
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{gift.title}</h3>
          {gift.external_url && (
            <a
              href={gift.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Voir le produit"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {gift.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{gift.description}</p>
        )}

        {/* Progress */}
        <div className="mt-auto space-y-1.5">
          <Progress value={percent} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Number(gift.current_amount).toLocaleString("fr-FR")} € collectés</span>
            <span className="font-medium text-foreground">
              {Number(gift.target_amount).toLocaleString("fr-FR")} €
            </span>
          </div>
        </div>

        {!isFunded && (
          <Button asChild size="sm" className="mt-3 w-full">
            <Link href={`/m/${weddingSlug}/contribuer?gift=${gift.id}`}>Participer</Link>
          </Button>
        )}
      </div>
    </article>
  )
}

export function WeddingGiftsSection({ gifts, weddingSlug }: WeddingGiftsSectionProps) {
  if (gifts.length === 0) return null

  return (
    <section id="liste-cadeaux" className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-4 text-center text-3xl sm:text-4xl">Liste de cadeaux</h2>
        <p className="mb-12 text-center text-muted-foreground">
          Participez à notre bonheur en offrant ce qui nous tient à cœur.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} weddingSlug={weddingSlug} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href={`/m/${weddingSlug}/contribuer`}>Faire une contribution libre</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

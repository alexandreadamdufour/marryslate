import { MapPin, Shirt, ExternalLink } from "lucide-react"
import type { PracticalInfo, VenueInfo } from "@/lib/validators/practical-info"

interface Props {
  info: PracticalInfo | null
}

export function WeddingPracticalInfoSection({ info }: Props) {
  if (!info) return null

  const hasCeremony = !!(info.venue_ceremony?.name || info.venue_ceremony?.address)
  const hasReception = !!(info.venue_reception?.name || info.venue_reception?.address)
  const hasDressCode = !!info.dress_code

  if (!hasCeremony && !hasReception && !hasDressCode) return null

  return (
    <section id="infos-pratiques" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-xl px-6">
        <h2 className="mb-10 text-center font-serif text-3xl sm:text-4xl">Infos pratiques</h2>

        <div className="space-y-8">
          {hasCeremony && (
            <VenueCard label="Lieu de la cérémonie" venue={info.venue_ceremony!} />
          )}
          {hasReception && (
            <VenueCard label="Lieu de la réception" venue={info.venue_reception!} />
          )}

          {hasDressCode && (
            <div className="flex gap-4">
              <Shirt className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Dress code</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {info.dress_code}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

function VenueCard({ label, venue }: { label: string; venue: VenueInfo }) {
  return (
    <div className="flex gap-4">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="font-semibold">{label}</p>
        {venue.name && <p className="mt-1 font-medium">{venue.name}</p>}
        {venue.address && (
          <p className="text-sm text-muted-foreground">{venue.address}</p>
        )}
        {venue.maps_url && (
          <a
            href={venue.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Voir sur la carte
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

import { Hotel, ExternalLink } from "lucide-react"
import type { AccommodationInfo } from "@/lib/validators/practical-info"

interface Props {
  accommodations: AccommodationInfo[] | undefined
}

export function WeddingAccommodationsSection({ accommodations }: Props) {
  if (!accommodations || accommodations.length === 0) return null

  return (
    <section id="ou-dormir" className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10 flex items-center justify-center gap-3">
          <Hotel className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="text-center font-serif text-3xl sm:text-4xl">Où dormir</h2>
        </div>

        <div className="space-y-3">
          {accommodations.map((acc, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{acc.name}</p>
                  {acc.address && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{acc.address}</p>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                    {acc.distance && <span>{acc.distance}</span>}
                    {acc.price_range && <span>{acc.price_range}</span>}
                  </div>
                </div>
                {acc.booking_url && (
                  <a
                    href={acc.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Réserver
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

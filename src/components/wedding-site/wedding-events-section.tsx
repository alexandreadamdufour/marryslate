import { Calendar, MapPin, Clock } from "lucide-react"
import type { WeddingEvent } from "@/queries/wedding"

interface WeddingEventsSectionProps {
  events: WeddingEvent[]
}

function formatEventDate(start: string | null, end: string | null): string {
  if (!start) return ""
  const date = new Date(start).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const startTime = new Date(start).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const endTime = end
    ? new Date(end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null

  return `${date} · ${startTime}${endTime ? ` – ${endTime}` : ""}`
}

export function WeddingEventsSection({ events }: WeddingEventsSectionProps) {
  if (events.length === 0) return null

  return (
    <section id="programme" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-12 text-center text-3xl sm:text-4xl">Programme</h2>
        <div className="space-y-8">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:gap-8"
            >
              {/* Date column */}
              <div className="flex flex-row items-center gap-3 sm:min-w-[140px] sm:flex-col sm:items-start sm:gap-1">
                {event.start_at && (
                  <>
                    <Calendar className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.start_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="font-medium">
                        {new Date(event.start_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.end_at &&
                          ` – ${new Date(event.end_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Info column */}
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.location_name && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p>{event.location_name}</p>
                      {event.location_address && <p>{event.location_address}</p>}
                    </div>
                  </div>
                )}
                {event.dress_code && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      <span className="text-muted-foreground">Tenue : </span>
                      {event.dress_code}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Keep named export for backward compat
export { formatEventDate }

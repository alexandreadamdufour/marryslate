import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { getAllGuestbookMessages } from "@/queries/guestbook"

export const metadata: Metadata = { title: "Livre d'or" }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function LivreOrPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const messages = await getAllGuestbookMessages(wedding.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Livre d&apos;or</h1>
        <p className="text-sm text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? "s" : ""} reçu{messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {messages.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aucun message pour l&apos;instant. Partagez le lien de votre site !
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const initial = m.author_name[0]?.toUpperCase() ?? "?"
            return (
              <div
                key={m.id}
                className="flex items-start gap-4 rounded-lg border bg-card px-4 py-4"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                  aria-hidden="true"
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium">{m.author_name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                    {!m.is_visible && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        masqué
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

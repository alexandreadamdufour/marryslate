import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { getRsvpResponsesByWedding } from "@/queries/rsvp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RsvpToggle } from "@/components/dashboard/rsvp-toggle"

export const metadata: Metadata = { title: "Invités" }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function InvitesPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const { responses, totalAttending, totalNotAttending, totalGuests } =
    await getRsvpResponsesByWedding(wedding.id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Invités</h1>
          <p className="text-sm text-muted-foreground">
            {responses.length} réponse{responses.length !== 1 ? "s" : ""} reçue
            {responses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <RsvpToggle weddingId={wedding.id} initialEnabled={wedding.rsvp_enabled} />
      </div>

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Présences confirmées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{totalAttending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absences notées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalNotAttending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personnes attendues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalGuests}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Liste */}
      {responses.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="mb-2 text-base">
            {wedding.rsvp_enabled
              ? "Aucune réponse pour l'instant. Partagez le lien de votre site !"
              : "Activez le formulaire RSVP pour commencer à recevoir des réponses."}
          </p>
          {!wedding.rsvp_enabled && (
            <p className="text-sm">
              Cliquez sur le bouton en haut à droite pour activer le RSVP.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card px-4 py-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {r.first_name} {r.last_name}
                  </span>
                  <Badge
                    variant={r.attending ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {r.attending ? `Présent·e — ${r.guest_count} pers.` : "Absent·e"}
                  </Badge>
                </div>
                {r.email && (
                  <p className="text-sm text-muted-foreground">{r.email}</p>
                )}
                {r.dietary && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Régime :</span>{" "}
                    {r.dietary}
                  </p>
                )}
                {r.message && (
                  <p className="text-sm italic text-muted-foreground">
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatDate(r.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

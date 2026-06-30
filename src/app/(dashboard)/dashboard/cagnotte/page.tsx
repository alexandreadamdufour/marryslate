import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import { getMyWedding } from "@/queries/wedding"
import { getFreeContributionsByWedding, getFreeContributionTotals } from "@/queries/contributions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Cagnotte libre" }

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  succeeded: { label: "Reçue", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  failed: { label: "Échouée", variant: "destructive" },
}

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function CagnottePage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const [contributions, totals] = await Promise.all([
    getFreeContributionsByWedding(wedding.id),
    getFreeContributionTotals(wedding.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Cagnotte libre</h1>
        <p className="text-sm text-muted-foreground">
          {totals.count} contribution{totals.count !== 1 ? "s" : ""} libre{totals.count !== 1 ? "s" : ""} reçue{totals.count !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Totaux */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total brut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {totals.totalGross.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net (après frais)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {totals.totalNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Marryslate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">
              {totals.totalFees.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Liste */}
      {contributions.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Aucune contribution libre pour l&apos;instant. Le lien de contribution de votre site accepte déjà les dons libres !
        </p>
      ) : (
        <div className="space-y-3">
          {contributions.map((c) => {
            const status = statusLabel[c.payment_status] ?? { label: c.payment_status, variant: "outline" as const }
            return (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
              >
                {c.contributor_photo_url && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={c.contributor_photo_url}
                      alt="Photo souvenir"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {c.is_anonymous ? "Anonyme" : c.guest_name}
                    </span>
                    <Badge variant={status.variant} className="shrink-0 text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  {c.guest_message && (
                    <p className="mt-0.5 truncate text-sm italic text-muted-foreground">
                      &quot;{c.guest_message}&quot;
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                </div>

                <div className="ml-auto shrink-0 text-right">
                  <p className="font-semibold">
                    {Number(c.gross_amount).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                  {c.payment_status === "succeeded" && (
                    <p className="text-xs text-muted-foreground">
                      {formatEuros(Math.round(Number(c.net_amount) * 100))} net
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { notFound } from "next/navigation"
import type { Metadata, Route } from "next"
import Image from "next/image"
import { HeartHandshake } from "lucide-react"
import { getMyWedding } from "@/queries/wedding"
import { getContributionsByWedding, getWeddingTotals } from "@/queries/contributions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata: Metadata = { title: "Contributions" }

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

export default async function ContributionsPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const [contributions, totals] = await Promise.all([
    getContributionsByWedding(wedding.id),
    getWeddingTotals(wedding.id),
  ])

  const succeeded = contributions.filter((c) => c.payment_status === "succeeded")

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contributions</h1>
          <p className="text-sm text-muted-foreground">
            {totals.count} contribution{totals.count !== 1 ? "s" : ""} reçue{totals.count !== 1 ? "s" : ""}
          </p>
        </div>
        {contributions.length > 0 && <ExportCsvButton weddingId={wedding.id} />}
      </div>

      {/* Totaux */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total brut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {totals.totalGross.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net (après frais)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {totals.totalNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:bg-muted/50">
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
        <EmptyState
          icon={HeartHandshake}
          title="Aucune contribution pour l'instant."
          description="Partagez le lien de votre site pour recevoir vos premières contributions."
          action={{ label: "Voir mon site", href: `/m/${wedding.slug}` as Route }}
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributeur</TableHead>
                <TableHead className="hidden md:table-cell">Cadeau</TableHead>
                <TableHead className="hidden md:table-cell">Message</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Brut</TableHead>
                <TableHead className="hidden text-right md:table-cell">Net</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((c) => {
                const status = statusLabel[c.payment_status] ?? { label: c.payment_status, variant: "outline" as const }
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {c.contributor_photo_url && (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                            <Image
                              src={c.contributor_photo_url}
                              alt="Photo souvenir"
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span>{c.is_anonymous ? "Anonyme" : c.guest_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.gift?.title ?? "—"}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate italic text-muted-foreground md:table-cell">
                      {c.guest_message ? `"${c.guest_message}"` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="shrink-0 text-xs">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(c.gross_amount).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                      {c.payment_status === "succeeded"
                        ? formatEuros(Math.round(Number(c.net_amount) * 100))
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(c.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {succeeded.length === 0 && contributions.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Les contributions en attente apparaîtront confirmées après traitement du paiement.
        </p>
      )}
    </div>
  )
}

import { notFound } from "next/navigation"
import type { Metadata, Route } from "next"
import { History } from "lucide-react"
import { getMyWedding } from "@/queries/wedding"
import { getWeddingTotals } from "@/queries/contributions"
import { getWithdrawalsByWedding } from "@/queries/withdrawals"
import { getAccountStatus, getAccountBalance } from "@/lib/stripe/connect"
import { PayoutSetup } from "@/components/dashboard/payout-setup"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = { title: "Retrait" }

const withdrawalStatusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  processing: { label: "En cours", variant: "secondary" },
  succeeded: { label: "Versé", variant: "default" },
  failed: { label: "Échoué", variant: "destructive" },
}

export default async function RetraitPage() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) notFound()

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from("users")
    .select("id, stripe_account_id, kyc_status")
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null)
    .maybeSingle()

  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const stripeAccountId = user?.stripe_account_id ?? wedding.stripe_account_id

  const [totals, withdrawals] = await Promise.all([
    getWeddingTotals(wedding.id),
    getWithdrawalsByWedding(wedding.id),
  ])

  // Determine account status and balance
  let isActive = false
  let availableEuros = 0

  if (stripeAccountId) {
    const [accountInfo, balanceCentimes] = await Promise.all([
      getAccountStatus(stripeAccountId),
      getAccountBalance(stripeAccountId),
    ])
    isActive = accountInfo.status === "active"
    availableEuros = balanceCentimes / 100
  }

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "succeeded")
    .reduce((s, w) => s + Number(w.amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Retrait</h1>
        <p className="text-sm text-muted-foreground">Retirez les fonds collectés vers votre compte bancaire.</p>
      </div>

      {/* Synthèse financière */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total collecté (net)</p>
          <p className="mt-1 text-2xl font-semibold">
            {totals.totalNet.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Déjà retiré</p>
          <p className="mt-1 text-2xl font-semibold">
            {totalWithdrawn.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Disponible maintenant</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {availableEuros.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </div>
      </div>

      {/* Setup / Payout form */}
      <PayoutSetup
        hasStripeAccount={!!stripeAccountId}
        isActive={isActive}
        availableEuros={availableEuros}
      />

      {/* Historique des retraits */}
      <Separator />
      <div>
        <h2 className="mb-4 text-lg font-semibold">Historique des retraits</h2>
        {withdrawals.length === 0 ? (
          <EmptyState
            icon={History}
            size="sm"
            title="Aucun retrait pour l'instant."
            action={{ label: "Voir mon site", href: `/m/${wedding.slug}` as Route }}
          />
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const status = withdrawalStatusLabel[w.status] ?? { label: w.status, variant: "outline" as const }
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {Number(w.amount).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

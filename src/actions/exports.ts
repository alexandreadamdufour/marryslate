"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getContributionsByWedding } from "@/queries/contributions"

type ActionResult<T> =
  | { data: T; error?: never }
  | { error: string; data?: never }

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export async function exportContributionsCSV(): Promise<ActionResult<{ csv: string; filename: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return { error: "USER_NOT_FOUND" }

  const { data: coowner } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!coowner) return { error: "NO_WEDDING" }

  const contributions = await getContributionsByWedding(coowner.wedding_id)

  const headers = [
    "Date",
    "Nom invité",
    "Email",
    "Cadeau",
    "Montant brut (€)",
    "Commission (€)",
    "Montant net (€)",
    "Statut",
    "Anonyme",
    "Message",
  ]

  const rows = contributions.map((c) => [
    escapeCsv(formatDate(c.created_at)),
    escapeCsv(c.is_anonymous ? "Anonyme" : c.guest_name),
    escapeCsv(c.is_anonymous ? null : c.guest_email),
    escapeCsv(c.gift?.title ?? "Contribution libre"),
    escapeCsv(Number(c.gross_amount).toFixed(2)),
    escapeCsv(Number(c.fee_amount).toFixed(2)),
    escapeCsv(Number(c.net_amount).toFixed(2)),
    escapeCsv(c.payment_status),
    escapeCsv(c.is_anonymous ? "Oui" : "Non"),
    escapeCsv(c.guest_message),
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

  const date = new Date().toISOString().slice(0, 10)
  const filename = `amora-contributions-${date}.csv`

  return { data: { csv, filename } }
}

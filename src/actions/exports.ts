"use server"

import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getContributionsByWedding } from "@/queries/contributions"
import { RSVP_STATUS_LABELS, SIDE_LABELS } from "@/lib/validators/guest"

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

export async function exportContributionsCSV(weddingId: string): Promise<ActionResult<{ csv: string; filename: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return { error: "USER_NOT_FOUND" }

  const { data: ownership } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .eq("wedding_id", weddingId)
    .maybeSingle()

  if (!ownership) return { error: "FORBIDDEN" }

  const contributions = await getContributionsByWedding(weddingId)

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

export async function exportRsvpCSV(weddingId: string): Promise<ActionResult<{ csv: string; filename: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return { error: "USER_NOT_FOUND" }

  const { data: ownership } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .eq("wedding_id", weddingId)
    .maybeSingle()

  if (!ownership) return { error: "FORBIDDEN" }

  const { data } = await supabase
    .from("rsvp_responses")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })

  const responses = data ?? []

  const headers = [
    "Date",
    "Prénom",
    "Nom",
    "Email",
    "Présent",
    "Nombre de personnes",
    "Régime alimentaire",
    "Message",
  ]

  const rows = responses.map((r) => [
    escapeCsv(formatDate(r.created_at)),
    escapeCsv(r.first_name),
    escapeCsv(r.last_name),
    escapeCsv(r.email),
    escapeCsv(r.attending ? "Oui" : "Non"),
    escapeCsv(r.attending ? String(r.guest_count) : ""),
    escapeCsv(r.dietary),
    escapeCsv(r.message),
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

  const date = new Date().toISOString().slice(0, 10)
  const filename = `amora-invites-${date}.csv`

  return { data: { csv, filename } }
}

export async function exportGuestsCSV(weddingId: string): Promise<ActionResult<{ csv: string; filename: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()
  if (!user) return { error: "USER_NOT_FOUND" }

  const { data: ownership } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .eq("wedding_id", weddingId)
    .maybeSingle()
  if (!ownership) return { error: "FORBIDDEN" }

  const { data } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })

  const guests = data ?? []

  const headers = [
    "Prénom",
    "Nom",
    "Email",
    "Téléphone",
    "Côté",
    "Groupe",
    "Régime alimentaire",
    "Plus one",
    "Prénom plus one",
    "Invitation envoyée",
    "Statut RSVP",
    "Notes",
  ]

  const rows = guests.map((g) => [
    escapeCsv(g.first_name),
    escapeCsv(g.last_name),
    escapeCsv(g.email),
    escapeCsv(g.phone),
    escapeCsv(SIDE_LABELS[g.side as keyof typeof SIDE_LABELS] ?? g.side),
    escapeCsv(g.group_name),
    escapeCsv(g.dietary),
    escapeCsv(g.plus_one ? "Oui" : "Non"),
    escapeCsv(g.plus_one_name),
    escapeCsv(g.invitation_sent ? "Oui" : "Non"),
    escapeCsv(RSVP_STATUS_LABELS[g.rsvp_status as keyof typeof RSVP_STATUS_LABELS] ?? g.rsvp_status),
    escapeCsv(g.notes),
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const date = new Date().toISOString().slice(0, 10)
  const filename = `amora-guests-${date}.csv`

  return { data: { csv, filename } }
}

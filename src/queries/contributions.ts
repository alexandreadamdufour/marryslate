import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type Contribution = Tables<"contributions">

export type ContributionWithGift = Contribution & {
  gift: { title: string } | null
}

export async function getContributionsByWedding(
  weddingId: string
): Promise<ContributionWithGift[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("contributions")
    .select("*, gift:gifts(title)")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })

  return (data ?? []) as ContributionWithGift[]
}

export async function getWeddingTotals(weddingId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("contributions")
    .select("gross_amount, net_amount, fee_amount")
    .eq("wedding_id", weddingId)
    .eq("payment_status", "succeeded")

  const rows = data ?? []
  return {
    totalGross: rows.reduce((s, r) => s + Number(r.gross_amount), 0),
    totalNet: rows.reduce((s, r) => s + Number(r.net_amount), 0),
    totalFees: rows.reduce((s, r) => s + Number(r.fee_amount), 0),
    count: rows.length,
  }
}

export async function getFreeContributionsByWedding(
  weddingId: string
): Promise<Contribution[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("contributions")
    .select("*")
    .eq("wedding_id", weddingId)
    .is("gift_id", null)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function getFreeContributionTotals(weddingId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("contributions")
    .select("gross_amount, net_amount, fee_amount")
    .eq("wedding_id", weddingId)
    .is("gift_id", null)
    .eq("payment_status", "succeeded")

  const rows = data ?? []
  return {
    totalGross: rows.reduce((s, r) => s + Number(r.gross_amount), 0),
    totalNet: rows.reduce((s, r) => s + Number(r.net_amount), 0),
    totalFees: rows.reduce((s, r) => s + Number(r.fee_amount), 0),
    count: rows.length,
  }
}

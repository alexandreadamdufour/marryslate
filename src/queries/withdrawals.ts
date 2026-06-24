import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type Withdrawal = Tables<"withdrawals">

export async function getWithdrawalsByWedding(weddingId: string): Promise<Withdrawal[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })
  return data ?? []
}

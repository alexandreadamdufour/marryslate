import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type BudgetItem = Tables<"budget_items">

export async function getBudgetItems(weddingId: string): Promise<BudgetItem[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("budget_items")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })
  return data ?? []
}

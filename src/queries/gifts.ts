import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type Gift = Tables<"gifts">

export async function getGiftsByWedding(weddingId: string): Promise<Gift[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("gifts")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function getGiftById(giftId: string): Promise<Gift | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("gifts").select("*").eq("id", giftId).maybeSingle()
  return data
}

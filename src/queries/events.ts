import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type WeddingEvent = Tables<"wedding_events">

export async function getWeddingEvents(weddingId: string): Promise<WeddingEvent[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("wedding_events")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
  return data ?? []
}

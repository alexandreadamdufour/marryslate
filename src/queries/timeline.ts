import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type TimelineStep = Tables<"wedding_timeline">

export async function getTimelineSteps(weddingId: string): Promise<TimelineStep[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("wedding_timeline")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true })
  return data ?? []
}

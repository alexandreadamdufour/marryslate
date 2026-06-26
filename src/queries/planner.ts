import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"
import { DEFAULT_CHECKLIST } from "@/lib/validators/planner"

export type ChecklistItem = Tables<"checklist_items">

export async function getChecklistItems(weddingId: string): Promise<ChecklistItem[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })

  if (data !== null && data.length === 0) {
    await supabase.from("checklist_items").insert(
      DEFAULT_CHECKLIST.map((item) => ({
        wedding_id: weddingId,
        category: item.category,
        title: item.title,
        priority: item.priority,
      }))
    )
    const { data: seeded } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: true })
    return seeded ?? []
  }

  return data ?? []
}

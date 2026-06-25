import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type GuestbookMessage = Tables<"guestbook_messages">

export async function getGuestbookMessages(weddingId: string): Promise<GuestbookMessage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("guestbook_messages")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function getAllGuestbookMessages(weddingId: string): Promise<GuestbookMessage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("guestbook_messages")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })
  return data ?? []
}

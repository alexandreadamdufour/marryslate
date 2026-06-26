import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type Guest = Tables<"guests">

export async function getGuestsByWedding(weddingId: string): Promise<Guest[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })
  return data ?? []
}

export async function getGuestByEmail(
  weddingId: string,
  email: string
): Promise<Guest | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("guests")
    .select("id, rsvp_status")
    .eq("wedding_id", weddingId)
    .eq("email", email)
    .maybeSingle()
  return data as Guest | null
}

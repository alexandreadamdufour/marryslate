import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type RsvpResponse = Tables<"rsvp_responses">

export interface RsvpSummary {
  responses: RsvpResponse[]
  totalAttending: number
  totalNotAttending: number
  totalGuests: number
}

export async function getRsvpResponsesByWedding(weddingId: string): Promise<RsvpSummary> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("rsvp_responses")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })

  const responses = data ?? []
  const attending = responses.filter((r) => r.attending)
  const totalGuests = attending.reduce((sum, r) => sum + r.guest_count, 0)

  return {
    responses,
    totalAttending: attending.length,
    totalNotAttending: responses.length - attending.length,
    totalGuests,
  }
}

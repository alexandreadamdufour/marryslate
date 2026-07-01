import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type RsvpResponse = Tables<"rsvp_responses">

export interface RsvpResponsesByStatus {
  pendingValidation: RsvpResponse[]
  conflict: RsvpResponse[]
  matched: RsvpResponse[]
  rejected: RsvpResponse[]
  counts: {
    pendingValidation: number
    conflict: number
    matched: number
    rejected: number
    totalAttending: number
    totalGuests: number
  }
}

export async function getRsvpResponsesByWedding(weddingId: string): Promise<RsvpResponsesByStatus> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("rsvp_responses")
    .select("*")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: false })

  const responses = data ?? []

  const pendingValidation = responses.filter((r) => r.status === "pending_validation")
  const conflict = responses.filter((r) => r.status === "conflict")
  const matched = responses.filter((r) => r.status === "matched")
  const rejected = responses.filter((r) => r.status === "rejected")

  const attending = responses.filter((r) => r.attending)

  return {
    pendingValidation,
    conflict,
    matched,
    rejected,
    counts: {
      pendingValidation: pendingValidation.length,
      conflict: conflict.length,
      matched: matched.length,
      rejected: rejected.length,
      totalAttending: attending.length,
      totalGuests: attending.reduce((sum, r) => sum + r.guest_count, 0),
    },
  }
}

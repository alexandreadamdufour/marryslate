import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type RsvpResponse = Tables<"rsvp_responses">

export type ConflictResponse = RsvpResponse & {
  guest: { first_name: string | null; last_name: string | null; rsvp_status: string } | null
}

export interface RsvpResponsesByStatus {
  pendingValidation: RsvpResponse[]
  conflict: ConflictResponse[]
  matched: RsvpResponse[]
  resolvedKeptCouple: RsvpResponse[]
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
  const conflictRaw = responses.filter((r) => r.status === "conflict")
  const matched = responses.filter((r) => r.status === "matched")
  const resolvedKeptCouple = responses.filter((r) => r.status === "resolved_kept_couple")
  const rejected = responses.filter((r) => r.status === "rejected")

  // Un seul SELECT batché sur les guest_id des conflits (pas de N+1).
  const conflictGuestIds = [
    ...new Set(conflictRaw.map((r) => r.guest_id).filter((id): id is string => !!id)),
  ]

  const guestsById = new Map<
    string,
    { first_name: string | null; last_name: string | null; rsvp_status: string }
  >()
  if (conflictGuestIds.length > 0) {
    const { data: guestsData } = await supabase
      .from("guests")
      .select("id, first_name, last_name, rsvp_status")
      .in("id", conflictGuestIds)
    for (const g of guestsData ?? []) {
      guestsById.set(g.id, { first_name: g.first_name, last_name: g.last_name, rsvp_status: g.rsvp_status })
    }
  }

  const conflict: ConflictResponse[] = conflictRaw.map((r) => ({
    ...r,
    guest: r.guest_id ? (guestsById.get(r.guest_id) ?? null) : null,
  }))

  const attending = responses.filter((r) => r.attending)

  return {
    pendingValidation,
    conflict,
    matched,
    resolvedKeptCouple,
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

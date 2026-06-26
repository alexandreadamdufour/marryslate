"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import {
  createGuestSchema,
  updateGuestSchema,
  importGuestsSchema,
  type CreateGuestInput,
  type UpdateGuestInput,
  type ImportGuestsInput,
} from "@/lib/validators/guest"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

function toRow(d: Omit<CreateGuestInput, "weddingId">) {
  return {
    ...(d.firstName !== undefined && { first_name: d.firstName ?? null }),
    ...(d.lastName !== undefined && { last_name: d.lastName ?? null }),
    ...(d.email !== undefined && { email: d.email || null }),
    ...(d.phone !== undefined && { phone: d.phone ?? null }),
    ...(d.groupName !== undefined && { group_name: d.groupName ?? null }),
    ...(d.side !== undefined && { side: d.side }),
    ...(d.dietary !== undefined && { dietary: d.dietary ?? null }),
    ...(d.plusOne !== undefined && { plus_one: d.plusOne }),
    ...(d.plusOneName !== undefined && { plus_one_name: d.plusOneName ?? null }),
    ...(d.invitationSent !== undefined && { invitation_sent: d.invitationSent }),
    ...(d.rsvpStatus !== undefined && { rsvp_status: d.rsvpStatus }),
    ...(d.notes !== undefined && { notes: d.notes ?? null }),
  }
}

export async function createGuest(
  input: CreateGuestInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createGuestSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const { weddingId, ...rest } = parsed.data
  const { data: guest, error } = await supabase
    .from("guests")
    .insert({ wedding_id: weddingId, ...toRow(rest) })
    .select("id")
    .single()

  if (error ?? !guest) {
    console.error("[createGuest]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { id: guest.id } }
}

export async function updateGuest(
  input: UpdateGuestInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateGuestSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { guestId, ...rest } = parsed.data
  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("guests")
    .select("wedding_id")
    .eq("id", guestId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { data: updated, error } = await supabase
    .from("guests")
    .update(toRow(rest))
    .eq("id", guestId)
    .select("id")
    .single()

  if (error ?? !updated) {
    console.error("[updateGuest]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { id: updated.id } }
}

export async function deleteGuest(guestId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("guests")
    .select("wedding_id")
    .eq("id", guestId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("guests").delete().eq("id", guestId)
  if (error) {
    console.error("[deleteGuest]", error.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: undefined }
}

export async function importGuests(
  input: ImportGuestsInput
): Promise<ActionResult<{ count: number }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = importGuestsSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const rows = parsed.data.guests.map((g) => ({
    wedding_id: parsed.data.weddingId,
    ...toRow(g),
  }))

  const { error } = await supabase.from("guests").insert(rows)
  if (error) {
    console.error("[importGuests]", error.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { count: rows.length } }
}

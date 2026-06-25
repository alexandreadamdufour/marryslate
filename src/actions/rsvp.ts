"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { submitRsvpSchema, type SubmitRsvpInput } from "@/lib/validators/rsvp"
import { sendRsvpConfirmationToGuest, sendRsvpNotifToCouple } from "@/lib/resend/send"
import { revalidatePath } from "next/cache"

type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never }

export async function submitRsvp(
  input: SubmitRsvpInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = submitRsvpSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, firstName, lastName, email, attending, guestCount, dietary, message } =
    parsed.data

  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, is_published, rsvp_enabled, partner1_first_name, partner2_first_name, owner_id, slug")
    .eq("id", weddingId)
    .maybeSingle()

  if (!wedding?.is_published || !wedding.rsvp_enabled) {
    return { error: "RSVP_NOT_AVAILABLE" }
  }

  const { data: response, error: dbError } = await supabase
    .from("rsvp_responses")
    .insert({
      wedding_id: weddingId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      attending,
      guest_count: attending ? guestCount : 1,
      dietary: attending ? (dietary || null) : null,
      message: message || null,
    })
    .select("id")
    .single()

  if (dbError || !response) {
    console.error("[submitRsvp]", dbError?.message)
    return { error: "DB_ERROR" }
  }

  const guestName = `${firstName} ${lastName}`

  if (email) {
    sendRsvpConfirmationToGuest({
      guestEmail: email,
      guestName,
      attending,
      guestCount: attending ? guestCount : 0,
      weddingPartner1: wedding.partner1_first_name,
      weddingPartner2: wedding.partner2_first_name,
      weddingSlug: wedding.slug,
    }).catch((e) => console.error("[rsvp] guest email:", e))
  }

  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", wedding.owner_id)
    .maybeSingle()

  if (owner?.email) {
    sendRsvpNotifToCouple({
      coupleEmail: owner.email,
      guestName,
      attending,
      guestCount: attending ? guestCount : 0,
      dietary: attending ? (dietary || null) : null,
      weddingPartner1: wedding.partner1_first_name,
      weddingPartner2: wedding.partner2_first_name,
    }).catch((e) => console.error("[rsvp] couple notif:", e))
  }

  revalidatePath("/dashboard/invites")

  return { data: { id: response.id } }
}

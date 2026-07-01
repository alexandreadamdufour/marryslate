"use server"

import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { submitRsvpSchema, type SubmitRsvpInput } from "@/lib/validators/rsvp"
import { sendRsvpConfirmationToGuest, sendRsvpNotifToCouple } from "@/lib/resend/send"
import { revalidatePath } from "next/cache"
import { getClientIp, checkRsvpRateLimit } from "@/lib/rate-limit"

type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never }
type AdminClient = ReturnType<typeof createAdminClient>

// Matching par email (SPECS-RSVP.md, incrément 1 : pas de détection de conflit).
// citext sur guests.email/rsvp_responses.email → comparaison déjà insensible à la casse.
// Pas de contrainte unique (wedding_id, email) : si plusieurs guests partagent un email
// (ex. "M. et Mme Dupont"), on prend le plus ancien de façon déterministe (limitation connue).
async function matchGuestForRsvp(supabase: AdminClient, weddingId: string, email: string) {
  const { data: guests } = await supabase
    .from("guests")
    .select("id")
    .eq("wedding_id", weddingId)
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1)

  const guest = guests?.[0] ?? null
  return guest
    ? { guestId: guest.id, status: "matched" as const }
    : { guestId: null, status: "pending_validation" as const }
}

export async function submitRsvp(
  input: SubmitRsvpInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = submitRsvpSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const ip = getClientIp(await headers())
  if (!(await checkRsvpRateLimit(ip, parsed.data.weddingId))) {
    return { error: "RATE_LIMITED" }
  }

  const { weddingId, firstName, lastName, email, attending, guestCount, dietary, message } =
    parsed.data

  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, is_published, rsvp_enabled, partner1_first_name, partner2_first_name, owner_id, slug, notifications_enabled")
    .eq("id", weddingId)
    .maybeSingle()

  if (!wedding?.is_published || !wedding.rsvp_enabled) {
    return { error: "RSVP_NOT_AVAILABLE" }
  }

  const match = await matchGuestForRsvp(supabase, weddingId, email)

  const { data: response, error: dbError } = await supabase
    .from("rsvp_responses")
    .insert({
      wedding_id: weddingId,
      guest_id: match.guestId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      attending,
      guest_count: attending ? guestCount : 1,
      dietary: attending ? (dietary || null) : null,
      message: message || null,
      status: match.status,
    })
    .select("id")
    .single()

  if (dbError || !response) {
    console.error("[submitRsvp]", dbError?.message)
    return { error: "DB_ERROR" }
  }

  const guestName = `${firstName} ${lastName}`

  sendRsvpConfirmationToGuest({
    guestEmail: email,
    guestName,
    attending,
    guestCount: attending ? guestCount : 0,
    weddingPartner1: wedding.partner1_first_name,
    weddingPartner2: wedding.partner2_first_name,
    weddingSlug: wedding.slug,
  }).catch((e) => console.error("[rsvp] guest email:", e))

  const { data: owner } = await supabase
    .from("users")
    .select("email")
    .eq("id", wedding.owner_id)
    .maybeSingle()

  if (owner?.email && wedding.notifications_enabled) {
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

  // rsvp_status mis à jour seulement si matché (pas en pending_validation)
  if (match.status === "matched" && match.guestId) {
    const { error: syncError } = await supabase
      .from("guests")
      .update({ rsvp_status: attending ? "accepted" : "declined" })
      .eq("id", match.guestId)
    if (syncError) console.error("[submitRsvp] guest sync:", syncError.message)
  }

  revalidatePath("/dashboard/invites")

  return { data: { id: response.id } }
}

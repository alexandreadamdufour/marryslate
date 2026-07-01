"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { submitRsvpSchema, type SubmitRsvpInput } from "@/lib/validators/rsvp"
import { sendRsvpConfirmationToGuest, sendRsvpNotifToCouple } from "@/lib/resend/send"
import { revalidatePath } from "next/cache"
import { getClientIp, checkRsvpRateLimit } from "@/lib/rate-limit"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never }
type AdminClient = ReturnType<typeof createAdminClient>

const uuidSchema = z.string().uuid()

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

// Les 3 actions ci-dessous gèrent la file de validation dashboard (SPECS-RSVP.md,
// incrément 1 : rattacher/créer/rejeter une réponse pending_validation).
// Le check ownership lit response/guest via le client Clerk-scopé (RLS filtre déjà
// les weddings non possédés) puis appelle explicitement assertWeddingCoowner par
// cohérence avec le reste du code (défense en profondeur). Les mutations passent
// ensuite par service_role, comme le reste des Server Actions RSVP/guests.

export async function linkRsvpResponseToGuest(
  responseId: string,
  guestId: string
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  if (!uuidSchema.safeParse(responseId).success || !uuidSchema.safeParse(guestId).success) {
    return { error: "INVALID_INPUT" }
  }

  const authClient = await createClerkSupabaseClient()

  const { data: response } = await authClient
    .from("rsvp_responses")
    .select("id, wedding_id, attending, status")
    .eq("id", responseId)
    .maybeSingle()
  if (!response) return { error: "FORBIDDEN" }

  const { data: guest } = await authClient
    .from("guests")
    .select("id, wedding_id")
    .eq("id", guestId)
    .maybeSingle()
  if (!guest) return { error: "FORBIDDEN" }

  if (response.wedding_id !== guest.wedding_id) return { error: "FORBIDDEN" }
  if (!(await assertWeddingCoowner(authClient, response.wedding_id))) return { error: "FORBIDDEN" }
  if (response.status !== "pending_validation") return { error: "INVALID_STATE" }

  const admin = createAdminClient()

  const { error: responseError } = await admin
    .from("rsvp_responses")
    .update({ guest_id: guestId, status: "matched" })
    .eq("id", responseId)
  if (responseError) {
    logDbError("linkRsvpResponseToGuest:response", responseError)
    return { error: "DB_ERROR" }
  }

  const { error: guestError } = await admin
    .from("guests")
    .update({ rsvp_status: response.attending ? "accepted" : "declined" })
    .eq("id", guestId)
  if (guestError) {
    logDbError("linkRsvpResponseToGuest:guest", guestError)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { id: responseId } }
}

export async function createGuestFromRsvpResponse(
  responseId: string
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  if (!uuidSchema.safeParse(responseId).success) return { error: "INVALID_INPUT" }

  const authClient = await createClerkSupabaseClient()

  const { data: response } = await authClient
    .from("rsvp_responses")
    .select("id, wedding_id, first_name, last_name, email, attending, status")
    .eq("id", responseId)
    .maybeSingle()
  if (!response) return { error: "FORBIDDEN" }
  if (!(await assertWeddingCoowner(authClient, response.wedding_id))) return { error: "FORBIDDEN" }
  if (response.status !== "pending_validation") return { error: "INVALID_STATE" }

  const admin = createAdminClient()

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .insert({
      wedding_id: response.wedding_id,
      first_name: response.first_name,
      last_name: response.last_name,
      email: response.email,
      side: "both",
      rsvp_status: response.attending ? "accepted" : "declined",
    })
    .select("id")
    .single()

  if (guestError || !guest) {
    logDbError("createGuestFromRsvpResponse:guest", guestError)
    return { error: "DB_ERROR" }
  }

  const { error: responseError } = await admin
    .from("rsvp_responses")
    .update({ guest_id: guest.id, status: "matched" })
    .eq("id", responseId)
  if (responseError) {
    logDbError("createGuestFromRsvpResponse:response", responseError)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { id: responseId } }
}

export async function rejectRsvpResponse(
  responseId: string
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  if (!uuidSchema.safeParse(responseId).success) return { error: "INVALID_INPUT" }

  const authClient = await createClerkSupabaseClient()

  const { data: response } = await authClient
    .from("rsvp_responses")
    .select("id, wedding_id, status")
    .eq("id", responseId)
    .maybeSingle()
  if (!response) return { error: "FORBIDDEN" }
  if (!(await assertWeddingCoowner(authClient, response.wedding_id))) return { error: "FORBIDDEN" }
  if (response.status !== "pending_validation") return { error: "INVALID_STATE" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("rsvp_responses")
    .update({ status: "rejected" })
    .eq("id", responseId)

  if (error) {
    logDbError("rejectRsvpResponse", error)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/invites")
  return { data: { id: responseId } }
}

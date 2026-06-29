"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { submitGuestbookSchema, type SubmitGuestbookInput } from "@/lib/validators/guestbook"
import { sendGuestbookNotifToCouple } from "@/lib/resend/send"
import { getClientIp, checkGuestbookRateLimit } from "@/lib/rate-limit"

type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never }

export async function submitGuestbookEntry(
  input: SubmitGuestbookInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = submitGuestbookSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const ip = getClientIp(await headers())
  if (!(await checkGuestbookRateLimit(ip, parsed.data.weddingId))) {
    return { error: "RATE_LIMITED" }
  }

  const { weddingId, authorName, message } = parsed.data
  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from("weddings")
    .select("slug, partner1_first_name, partner2_first_name, owner_id, notifications_enabled")
    .eq("id", weddingId)
    .eq("is_published", true)
    .maybeSingle()

  if (!wedding) return { error: "WEDDING_NOT_FOUND" }

  const { data, error } = await supabase
    .from("guestbook_messages")
    .insert({ wedding_id: weddingId, author_name: authorName, message })
    .select("id")
    .single()

  if (error ?? !data) {
    console.error("[submitGuestbookEntry]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath(`/m/${wedding.slug}`)
  revalidatePath("/dashboard/livre-d-or")

  if (wedding.notifications_enabled) {
    const { data: owner } = await supabase
      .from("users")
      .select("email")
      .eq("id", wedding.owner_id)
      .maybeSingle()

    if (owner?.email) {
      sendGuestbookNotifToCouple({
        coupleEmail: owner.email,
        authorName,
        message,
        weddingPartner1: wedding.partner1_first_name,
        weddingPartner2: wedding.partner2_first_name,
      }).catch((e) => console.error("[guestbook] notif:", e))
    }
  }

  return { data: { id: data.id } }
}

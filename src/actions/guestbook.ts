"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { submitGuestbookSchema, type SubmitGuestbookInput } from "@/lib/validators/guestbook"

type ActionResult<T> = { data: T; error?: never } | { error: string; data?: never }

export async function submitGuestbookEntry(
  input: SubmitGuestbookInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = submitGuestbookSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, authorName, message } = parsed.data
  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from("weddings")
    .select("slug")
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

  return { data: { id: data.id } }
}

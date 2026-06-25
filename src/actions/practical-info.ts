"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { updatePracticalInfoSchema, type UpdatePracticalInfoInput } from "@/lib/validators/practical-info"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

export async function updatePracticalInfo(
  input: UpdatePracticalInfoInput
): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updatePracticalInfoSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, ...practicalInfo } = parsed.data
  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("weddings")
    .update({ practical_info: practicalInfo, updated_at: new Date().toISOString() })
    .eq("id", weddingId)

  if (error) return { error: "DB_ERROR" }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("slug")
    .eq("id", weddingId)
    .maybeSingle()

  revalidatePath("/dashboard/site")
  if (wedding) revalidatePath(`/m/${wedding.slug}`)

  return { data: undefined }
}

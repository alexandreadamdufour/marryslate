"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { updatePracticalInfoSchema, type UpdatePracticalInfoInput } from "@/lib/validators/practical-info"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

export async function updatePracticalInfo(
  input: UpdatePracticalInfoInput
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updatePracticalInfoSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, ...practicalInfo } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

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

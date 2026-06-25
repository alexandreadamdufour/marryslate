"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

const schema = z.object({
  weddingId: z.string().uuid(),
  enabled: z.boolean(),
})

export async function updateWeddingNotifications(
  input: unknown
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, enabled } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("weddings")
    .update({ notifications_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", weddingId)

  if (error) return { error: "DB_ERROR" }

  revalidatePath("/dashboard/parametres")
  return { data: undefined }
}

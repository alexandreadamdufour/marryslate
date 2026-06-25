"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { updateAccessCodeSchema } from "@/lib/validators/access-code"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

export async function updateWeddingAccessCode(
  input: unknown
): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateAccessCodeSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, enabled, code } = parsed.data
  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("weddings")
    .update({
      access_code_enabled: enabled,
      // Keep the code when disabling so it's pre-filled when re-enabling
      ...(enabled ? { access_code: code ?? null } : {}),
      ...(!enabled ? { access_code_enabled: false } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", weddingId)

  if (error) return { error: "DB_ERROR" }

  revalidatePath("/dashboard/site")
  return { data: undefined }
}

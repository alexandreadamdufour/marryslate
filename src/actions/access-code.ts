"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateAccessCodeSchema } from "@/lib/validators/access-code"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

async function assertWeddingCoowner(clerkUserId: string, weddingId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()
  if (!user) return false
  const { data } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .eq("wedding_id", weddingId)
    .maybeSingle()
  return !!data
}

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

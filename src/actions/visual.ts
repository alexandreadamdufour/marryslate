"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateWeddingVisualSchema, type UpdateWeddingVisualInput } from "@/lib/validators/visual"

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

export async function updateWeddingVisual(
  input: UpdateWeddingVisualInput
): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateWeddingVisualSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, primaryColor, fontFamily } = parsed.data
  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("weddings")
    .update({
      primary_color: primaryColor ?? null,
      font_family: fontFamily ?? null,
      updated_at: new Date().toISOString(),
    })
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

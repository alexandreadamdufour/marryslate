"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { updateStorySchema, type UpdateStoryInput } from "@/lib/validators/story"

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

export async function updateStory(input: UpdateStoryInput): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateStorySchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, storyTitle, storyText, storyImages } = parsed.data
  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("weddings")
    .update({
      story_title: storyTitle ?? null,
      story_md: storyText ?? null,
      story_images: storyImages && storyImages.length > 0 ? storyImages : null,
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

export async function uploadStoryImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  const weddingId = formData.get("weddingId") as string | null
  if (!file || !weddingId) return { error: "INVALID_INPUT" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
  if (!allowedTypes.includes(file.type)) return { error: "INVALID_FILE_TYPE" }
  if (file.size > 5 * 1024 * 1024) return { error: "FILE_TOO_LARGE" }

  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const ext = file.type.split("/")[1]
  const path = `${weddingId}/story-${Date.now()}.${ext}`

  const supabase = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadStoryImage]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

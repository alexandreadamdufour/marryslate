"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { updateStorySchema, type UpdateStoryInput } from "@/lib/validators/story"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

export async function updateStory(input: UpdateStoryInput): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateStorySchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, storyTitle, storyText, storyImages } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

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
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  const weddingId = formData.get("weddingId") as string | null
  if (!file || !weddingId) return { error: "INVALID_INPUT" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
  if (!allowedTypes.includes(file.type)) return { error: "INVALID_FILE_TYPE" }
  if (file.size > 5 * 1024 * 1024) return { error: "FILE_TOO_LARGE" }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const ext = file.type.split("/")[1]
  const path = `${weddingId}/story-${Date.now()}.${ext}`

  // Storage: admin client — storage policies sont indépendantes de la DB RLS
  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadStoryImage]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

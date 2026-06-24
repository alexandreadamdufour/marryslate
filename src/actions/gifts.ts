"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  createGiftSchema,
  updateGiftSchema,
  reorderGiftsSchema,
  type CreateGiftInput,
  type UpdateGiftInput,
  type ReorderGiftsInput,
} from "@/lib/validators/gifts"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

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
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle()

  return !!data
}

export async function createGift(
  input: CreateGiftInput
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = createGiftSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const isCoowner = await assertWeddingCoowner(clerkUserId, parsed.data.weddingId)
  if (!isCoowner) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()

  // Calculer la prochaine position
  const { data: last } = await supabase
    .from("gifts")
    .select("position")
    .eq("wedding_id", parsed.data.weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? -1) + 1

  const { data: gift, error } = await supabase
    .from("gifts")
    .insert({
      wedding_id: parsed.data.weddingId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      target_amount: parsed.data.targetAmount,
      image_url: parsed.data.imageUrl ?? null,
      external_url: parsed.data.externalUrl ?? null,
      category: parsed.data.category ?? null,
      position,
    })
    .select("id")
    .single()

  if (error ?? !gift) {
    console.error("[createGift]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/liste")
  revalidatePath(`/m/`)
  return { data: { id: gift.id } }
}

export async function updateGift(
  input: UpdateGiftInput
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateGiftSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { giftId, ...rest } = parsed.data

  // Récupérer le gift pour avoir le weddingId
  const supabase = createAdminClient()
  const { data: gift } = await supabase
    .from("gifts")
    .select("wedding_id")
    .eq("id", giftId)
    .maybeSingle()

  if (!gift) return { error: "NOT_FOUND" }

  const isCoowner = await assertWeddingCoowner(clerkUserId, gift.wedding_id)
  if (!isCoowner) return { error: "FORBIDDEN" }

  const { data: updated, error } = await supabase
    .from("gifts")
    .update({
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.description !== undefined && { description: rest.description ?? null }),
      ...(rest.targetAmount !== undefined && { target_amount: rest.targetAmount }),
      ...(rest.imageUrl !== undefined && { image_url: rest.imageUrl ?? null }),
      ...(rest.externalUrl !== undefined && { external_url: rest.externalUrl ?? null }),
      ...(rest.category !== undefined && { category: rest.category ?? null }),
      ...(rest.isActive !== undefined && { is_active: rest.isActive }),
    })
    .eq("id", giftId)
    .select("id")
    .single()

  if (error ?? !updated) {
    console.error("[updateGift]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/liste")
  return { data: { id: updated.id } }
}

export async function deleteGift(giftId: string): Promise<ActionResult> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()
  const { data: gift } = await supabase
    .from("gifts")
    .select("wedding_id, current_amount")
    .eq("id", giftId)
    .maybeSingle()

  if (!gift) return { error: "NOT_FOUND" }

  if (Number(gift.current_amount) > 0) {
    // Soft-delete si des contributions existent déjà
    await supabase.from("gifts").update({ is_active: false }).eq("id", giftId)
  } else {
    const isCoowner = await assertWeddingCoowner(clerkUserId, gift.wedding_id)
    if (!isCoowner) return { error: "FORBIDDEN" }
    await supabase.from("gifts").delete().eq("id", giftId)
  }

  revalidatePath("/dashboard/liste")
  return { data: undefined }
}

export async function reorderGifts(
  input: ReorderGiftsInput
): Promise<ActionResult> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = reorderGiftsSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const isCoowner = await assertWeddingCoowner(clerkUserId, parsed.data.weddingId)
  if (!isCoowner) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()

  // Batch update des positions
  await Promise.all(
    parsed.data.positions.map(({ id, position }) =>
      supabase.from("gifts").update({ position }).eq("id", id)
    )
  )

  revalidatePath("/dashboard/liste")
  return { data: undefined }
}

export async function uploadGiftImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  const weddingId = formData.get("weddingId") as string | null

  if (!file || !weddingId) return { error: "INVALID_INPUT" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
  if (!allowedTypes.includes(file.type)) return { error: "INVALID_FILE_TYPE" }
  if (file.size > 5 * 1024 * 1024) return { error: "FILE_TOO_LARGE" }

  const isCoowner = await assertWeddingCoowner(clerkUserId, weddingId)
  if (!isCoowner) return { error: "FORBIDDEN" }

  const ext = file.type.split("/")[1]
  const path = `${weddingId}/${Date.now()}.${ext}`

  const supabase = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadGiftImage]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const { data: { publicUrl } } = supabase.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

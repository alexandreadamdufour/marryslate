"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import type { Database } from "@/lib/supabase/types"
import {
  createGiftSchema,
  updateGiftSchema,
  reorderGiftsSchema,
  type CreateGiftInput,
  type UpdateGiftInput,
  type ReorderGiftsInput,
} from "@/lib/validators/gifts"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

async function getWeddingSlug(supabase: SupabaseClient<Database>, weddingId: string): Promise<string | null> {
  const { data } = await supabase.from("weddings").select("slug").eq("id", weddingId).maybeSingle()
  return data?.slug ?? null
}

export async function createGift(
  input: CreateGiftInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createGiftSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

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
    logDbError("createGift", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, parsed.data.weddingId)
  revalidatePath("/dashboard/liste")
  if (slug) revalidatePath(`/m/${slug}`)
  return { data: { id: gift.id } }
}

export async function updateGift(
  input: UpdateGiftInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateGiftSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { giftId, ...rest } = parsed.data

  const supabase = await createClerkSupabaseClient()

  const { data: gift } = await supabase
    .from("gifts")
    .select("wedding_id")
    .eq("id", giftId)
    .maybeSingle()

  if (!gift) return { error: "NOT_FOUND" }

  if (!(await assertWeddingCoowner(supabase, gift.wedding_id))) return { error: "FORBIDDEN" }

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
    logDbError("updateGift", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, gift.wedding_id)
  revalidatePath("/dashboard/liste")
  if (slug) revalidatePath(`/m/${slug}`)
  return { data: { id: updated.id } }
}

export async function deleteGift(giftId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: gift } = await supabase
    .from("gifts")
    .select("wedding_id, current_amount")
    .eq("id", giftId)
    .maybeSingle()

  if (!gift) return { error: "NOT_FOUND" }

  if (!(await assertWeddingCoowner(supabase, gift.wedding_id))) return { error: "FORBIDDEN" }

  if (Number(gift.current_amount) > 0) {
    // Soft-delete si des contributions existent déjà
    await supabase.from("gifts").update({ is_active: false }).eq("id", giftId)
  } else {
    await supabase.from("gifts").delete().eq("id", giftId)
  }

  const slug = await getWeddingSlug(supabase, gift.wedding_id)
  revalidatePath("/dashboard/liste")
  if (slug) revalidatePath(`/m/${slug}`)
  return { data: undefined }
}

export async function reorderGifts(
  input: ReorderGiftsInput
): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = reorderGiftsSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const results = await Promise.all(
    parsed.data.positions.map(({ id, position }) =>
      supabase
        .from("gifts")
        .update({ position })
        .eq("id", id)
        .eq("wedding_id", parsed.data.weddingId)
    )
  )

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    failed.forEach((r) => logDbError("reorderGifts", r.error))
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, parsed.data.weddingId)
  revalidatePath("/dashboard/liste")
  if (slug) revalidatePath(`/m/${slug}`)
  return { data: undefined }
}

export async function uploadGiftImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
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
  const path = `${weddingId}/${Date.now()}.${ext}`

  // Storage: admin client — storage policies sont indépendantes de la DB RLS
  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadGiftImage]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const { data: { publicUrl } } = adminClient.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

"use server"

import { revalidatePath } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import type { Database } from "@/lib/supabase/types"
import { createWeddingSchema, updateWeddingSchema } from "@/lib/validators/wedding"
import type { CreateWeddingInput, UpdateWeddingInput } from "@/lib/validators/wedding"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

// Admin requis : INSERT sur users est réservé au webhook Clerk (pas de policy user-facing).
async function getOrCreateUser(clerkUserId: string) {
  const adminClient = createAdminClient()

  let { data: user } = await adminClient
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) {
    // Filet de sécurité : webhook user.created manqué (ex: ngrok redémarré).
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
    const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null

    const { data: newUser, error } = await adminClient
      .from("users")
      .insert({ clerk_user_id: clerkUserId, email, display_name: displayName })
      .select("id")
      .single()

    if (error) {
      if (error.code === "23505") {
        // webhook a gagné la course — le user existe déjà, on le relit
        const { data: existing } = await adminClient
          .from("users")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle()
        user = existing
      } else {
        logDbError("getOrCreateUser", error)
        return null
      }
    } else {
      user = newUser
    }
  }

  return user
}

export async function createWedding(
  input: CreateWeddingInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = createWeddingSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const user = await getOrCreateUser(clerkUserId)
  if (!user) return { error: "USER_NOT_FOUND" }

  // Admin requis : slug uniqueness porte sur tous les weddings, pas seulement ceux visibles par le user.
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from("weddings")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle()

  if (existing) return { error: "SLUG_TAKEN" }

  const supabase = await createClerkSupabaseClient()

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({
      owner_id: user.id,
      partner1_first_name: parsed.data.partner1FirstName,
      partner2_first_name: parsed.data.partner2FirstName,
      wedding_date: parsed.data.weddingDate ?? null,
      slug: parsed.data.slug,
      ...(parsed.data.themeId !== undefined && { theme_id: parsed.data.themeId }),
    })
    .select("id, slug")
    .single()

  if (weddingError ?? !wedding) {
    console.error("[createWedding] DB insert failed", {
      error: weddingError
        ? {
            code: weddingError.code,
            message: weddingError.message,
            details: weddingError.details,
            hint: weddingError.hint,
          }
        : "null (RLS silent block? wedding=null sans erreur Supabase)",
      owner_id: user.id,
      slug: parsed.data.slug,
    })
    return { error: "DB_ERROR" }
  }

  // wedding_coowners est peuplé automatiquement par le trigger DB
  // trg_ensure_owner_is_coowner (migration 20260703084245) — garantie
  // structurelle, plus besoin de le faire ici. Voir cette migration pour
  // le contexte du bug que ça corrige.

  revalidatePath("/dashboard")
  return { data: { id: wedding.id, slug: wedding.slug } }
}

export async function updateWedding(
  input: UpdateWeddingInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateWeddingSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { weddingId, ...rest } = parsed.data

  if (rest.slug) {
    // Admin requis : slug uniqueness porte sur tous les weddings.
    const adminClient = createAdminClient()
    const { data: existing } = await adminClient
      .from("weddings")
      .select("id")
      .eq("slug", rest.slug)
      .neq("id", weddingId)
      .maybeSingle()

    if (existing) return { error: "SLUG_TAKEN" }
  }

  type WeddingUpdate = Database["public"]["Tables"]["weddings"]["Update"]
  const updatePayload: WeddingUpdate = {
    ...(rest.partner1FirstName !== undefined && { partner1_first_name: rest.partner1FirstName }),
    ...(rest.partner2FirstName !== undefined && { partner2_first_name: rest.partner2FirstName }),
    ...(rest.weddingDate !== undefined && { wedding_date: rest.weddingDate ?? null }),
    ...(rest.slug !== undefined && { slug: rest.slug }),
    ...(rest.coverImageUrl !== undefined && { cover_image_url: rest.coverImageUrl }),
    ...(rest.themeId !== undefined && { theme_id: rest.themeId }),
    ...(rest.primaryColor !== undefined && { primary_color: rest.primaryColor }),
    ...(rest.storyMd !== undefined && { story_md: rest.storyMd }),
    ...(rest.isPublished !== undefined && { is_published: rest.isPublished }),
    ...(rest.rsvpEnabled !== undefined && { rsvp_enabled: rest.rsvpEnabled }),
  }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { data: wedding, error: updateError } = await supabase
    .from("weddings")
    .update(updatePayload)
    .eq("id", weddingId)
    .select("id, slug")
    .single()

  if (updateError ?? !wedding) {
    logDbError("updateWedding", updateError)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/site")
  revalidatePath(`/m/${wedding.slug}`)

  return { data: { id: wedding.id, slug: wedding.slug } }
}

// Admin requis : slug uniqueness porte sur tous les weddings (y compris non publiés).
export async function checkSlugAvailability(
  slug: string,
  excludeWeddingId?: string
): Promise<{ available: boolean }> {
  const trimmed = slug.trim().toLowerCase()
  const adminClient = createAdminClient()

  let query = adminClient.from("weddings").select("id").eq("slug", trimmed)
  if (excludeWeddingId) query = query.neq("id", excludeWeddingId)

  const { data } = await query.maybeSingle()
  return { available: !data }
}

export async function uploadCoverImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
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
  const path = `${weddingId}/cover-${Date.now()}.${ext}`

  // Storage: admin client — storage policies sont indépendantes de la DB RLS
  const adminClient = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadCoverImage]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

export async function completeOnboardingChecklist(
  weddingId: string
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("weddings")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", weddingId)
    .is("onboarding_completed_at", null)

  if (error) {
    logDbError("completeOnboardingChecklist", error)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard")
  return { data: { id: weddingId } }
}

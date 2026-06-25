"use server"

import { revalidatePath } from "next/cache"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"
import { createWeddingSchema, updateWeddingSchema } from "@/lib/validators/wedding"
import type { CreateWeddingInput, UpdateWeddingInput } from "@/lib/validators/wedding"

type ActionResult<T> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

// Helper : récupère ou crée le user interne depuis son clerkUserId.
// On utilise adminClient car createServerClient() n'envoie pas de JWT Clerk à Supabase,
// ce qui rend la RLS users_select_own inopérante dans les Server Actions.
async function getOrCreateUser(clerkUserId: string) {
  const adminClient = createAdminClient()

  let { data: user } = await adminClient
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) {
    // Filet de sécurité : webhook user.created manqué (ex: ngrok redémarré).
    // On crée le user à la volée depuis la session Clerk.
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
      console.error("[getOrCreateUser]", error.message)
      return null
    }
    user = newUser
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

  const adminClient = createAdminClient()

  const { data: existing } = await adminClient
    .from("weddings")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle()

  if (existing) return { error: "SLUG_TAKEN" }

  const { data: wedding, error: weddingError } = await adminClient
    .from("weddings")
    .insert({
      owner_id: user.id,
      partner1_first_name: parsed.data.partner1FirstName,
      partner2_first_name: parsed.data.partner2FirstName,
      wedding_date: parsed.data.weddingDate ?? null,
      slug: parsed.data.slug,
    })
    .select("id, slug")
    .single()

  if (weddingError ?? !wedding) {
    console.error("[createWedding]", weddingError?.message)
    return { error: "DB_ERROR" }
  }

  await adminClient.from("wedding_coowners").insert({
    wedding_id: wedding.id,
    user_id: user.id,
  })

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

  const user = await getOrCreateUser(clerkUserId)
  if (!user) return { error: "USER_NOT_FOUND" }

  const adminClient = createAdminClient()

  if (rest.slug) {
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

  // L'autorisation coowner est vérifiée via la table wedding_coowners (admin bypasse RLS).
  const { data: isCoowner } = await adminClient
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!isCoowner) return { error: "FORBIDDEN" }

  const { data: wedding, error: updateError } = await adminClient
    .from("weddings")
    .update(updatePayload)
    .eq("id", weddingId)
    .select("id, slug")
    .single()

  if (updateError ?? !wedding) {
    console.error("[updateWedding]", updateError?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/site")
  revalidatePath(`/m/${wedding.slug}`)

  return { data: { id: wedding.id, slug: wedding.slug } }
}

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

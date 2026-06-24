"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"
import { createWeddingSchema, updateWeddingSchema } from "@/lib/validators/wedding"
import type { CreateWeddingInput, UpdateWeddingInput } from "@/lib/validators/wedding"

type ActionResult<T> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

export async function createWedding(
  input: CreateWeddingInput
): Promise<ActionResult<{ id: string; slug: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = createWeddingSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createServerClient()

  // Récupérer l'ID interne du user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return { error: "USER_NOT_FOUND" }

  // Vérifier unicité du slug
  const { data: existing } = await supabase
    .from("weddings")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle()

  if (existing) return { error: "SLUG_TAKEN" }

  // Créer le wedding (utilise service_role pour bypasser RLS à la création initiale)
  const adminClient = createAdminClient()

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

  // Ajouter en tant que coowner
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
  const supabase = await createServerClient()

  // Vérifier que le user existe
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return { error: "USER_NOT_FOUND" }

  // Vérifier unicité du slug si changement
  if (rest.slug) {
    const { data: existing } = await supabase
      .from("weddings")
      .select("id")
      .eq("slug", rest.slug)
      .neq("id", weddingId)
      .maybeSingle()

    if (existing) return { error: "SLUG_TAKEN" }
  }

  // Construire le payload (seulement les champs fournis) avec le bon type Supabase
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
  }

  // RLS s'assure que seul un coowner peut mettre à jour
  const { data: wedding, error: updateError } = await supabase
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
  const supabase = await createServerClient()

  let query = supabase.from("weddings").select("id").eq("slug", trimmed)
  if (excludeWeddingId) query = query.neq("id", excludeWeddingId)

  const { data } = await query.maybeSingle()
  return { available: !data }
}

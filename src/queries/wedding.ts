import { auth } from "@clerk/nextjs/server"
import { createServerClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/types"

export type Wedding = Tables<"weddings">

export async function getMyWedding(): Promise<Wedding | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const supabase = await createServerClient()

  // 1. Récupérer l'ID interne
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return null

  // 2. Trouver le premier wedding dont le user est coowner
  const { data: coowner } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!coowner) return null

  // 3. Récupérer le wedding
  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", coowner.wedding_id)
    .maybeSingle()

  return wedding
}

export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  return data
}

export async function getWeddingById(id: string): Promise<Wedding | null> {
  const supabase = await createServerClient()
  const { data } = await supabase.from("weddings").select("*").eq("id", id).maybeSingle()
  return data
}

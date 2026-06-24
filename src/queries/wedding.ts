import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type Wedding = Tables<"weddings">
export type Gift = Tables<"gifts">
export type WeddingEvent = Tables<"wedding_events">

export type WeddingPublicData = Wedding & {
  gifts: Gift[]
  events: WeddingEvent[]
}

// ─── Authenticated queries (adminClient — Clerk JWT absent de Supabase) ───────

export async function getMyWedding(): Promise<Wedding | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return null

  const { data: coowner } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!coowner) return null

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("id", coowner.wedding_id)
    .maybeSingle()

  return wedding
}

export async function getWeddingById(id: string): Promise<Wedding | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from("weddings").select("*").eq("id", id).maybeSingle()
  return data
}

// ─── Public queries (anon key — RLS publique, pas de JWT requis) ──────────────

export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  return data
}

export async function getWeddingPublicData(slug: string): Promise<WeddingPublicData | null> {
  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (!wedding) return null

  const [{ data: gifts }, { data: events }] = await Promise.all([
    supabase
      .from("gifts")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("wedding_events")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("position", { ascending: true }),
  ])

  return {
    ...wedding,
    gifts: gifts ?? [],
    events: events ?? [],
  }
}

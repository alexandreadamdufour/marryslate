"use server"

import { createAdminClient } from "@/lib/supabase/admin"

const PAGE_SIZE = 12

export type WeddingSearchResult = {
  id: string
  partner1_first_name: string
  partner2_first_name: string
  slug: string
  wedding_date: string | null
  cover_image_url: string | null
}

export type SearchWeddingsResult =
  | { data: WeddingSearchResult[]; count: number; error?: never }
  | { error: string; data?: never; count?: never }

export async function searchWeddings(
  query: string,
  page: number = 1
): Promise<SearchWeddingsResult> {
  const supabase = createAdminClient()
  const offset = (page - 1) * PAGE_SIZE
  // Strip ilike wildcards to prevent accidental pattern injection
  const trimmed = query.trim().replace(/[%_\\]/g, "")

  let builder = supabase
    .from("weddings")
    .select(
      "id, partner1_first_name, partner2_first_name, slug, wedding_date, cover_image_url",
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("wedding_date", { ascending: true, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (trimmed) {
    builder = builder.or(
      `partner1_first_name.ilike.%${trimmed}%,partner2_first_name.ilike.%${trimmed}%`
    )
  }

  const { data, count, error } = await builder
  if (error) return { error: "SEARCH_ERROR" }
  return { data: data ?? [], count: count ?? 0 }
}

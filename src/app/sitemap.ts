import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr"

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/comment-ca-marche`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/tarifs`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/cgu`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const { data: weddings } = await supabase
    .from("weddings")
    .select("slug, updated_at")
    .eq("is_published", true)

  const weddingRoutes: MetadataRoute.Sitemap = (weddings ?? []).map((w) => ({
    url: `${BASE_URL}/m/${w.slug}`,
    lastModified: w.updated_at ? new Date(w.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [...STATIC_ROUTES, ...weddingRoutes]
}

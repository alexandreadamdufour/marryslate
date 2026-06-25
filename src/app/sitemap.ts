import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAllPosts } from "@/lib/blog"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr"

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/comment-ca-marche`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/tarifs`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/trouver-une-liste`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/cgu`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/cgv`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  const { data: weddings } = await supabase
    .from("weddings")
    .select("slug, updated_at, access_code_enabled")
    .eq("is_published", true)

  // Exclude access-code-protected weddings from public sitemap
  const weddingRoutes: MetadataRoute.Sitemap = (weddings ?? [])
    .filter((w) => !w.access_code_enabled)
    .map((w) => ({
      url: `${BASE_URL}/m/${w.slug}`,
      lastModified: w.updated_at ? new Date(w.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }))

  const posts = getAllPosts()
  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...STATIC_ROUTES, ...blogRoutes, ...weddingRoutes]
}

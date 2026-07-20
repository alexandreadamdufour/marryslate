import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"
import { env } from "@/lib/env"

const BASE_URL = env.NEXT_PUBLIC_APP_URL

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
  { url: `${BASE_URL}/comment-ca-marche`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/tarifs`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/trouver-une-liste`, changeFrequency: "monthly", priority: 0.6 },
  // mentions-legales, cgu, cgv, confidentialite volontairement absentes :
  // ces pages sont en noindex (metadata robots), les lister ici enverrait
  // un signal contradictoire à Google.
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sites de mariage (/m/[slug]) volontairement absents : données privées
  // du couple (noms, date, lieu, invités), toujours en noindex, jamais
  // dans le sitemap public.
  const posts = getAllPosts()
  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...STATIC_ROUTES, ...blogRoutes]
}

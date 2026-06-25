import fs from "fs"
import path from "path"
import matter from "gray-matter"

const BLOG_DIR = path.join(process.cwd(), "src/content/blog")

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  publishedAt: string // YYYY-MM-DD
  readingTime: number // minutes
  toc: boolean
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))

  const posts = files.map((filename): BlogPostMeta => {
    const slug = filename.replace(/\.mdx$/, "")
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8")
    const { data, content } = matter(raw)

    return {
      slug,
      title: (data["title"] as string | undefined) ?? slug,
      description: (data["description"] as string | undefined) ?? "",
      publishedAt: (data["publishedAt"] as string | undefined) ?? "2026-01-01",
      readingTime:
        typeof data["readingTime"] === "number"
          ? (data["readingTime"] as number)
          : estimateReadingTime(content),
      toc: data["toc"] === true,
    }
  })

  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)

  return {
    slug,
    title: (data["title"] as string | undefined) ?? slug,
    description: (data["description"] as string | undefined) ?? "",
    publishedAt: (data["publishedAt"] as string | undefined) ?? "2026-01-01",
    readingTime:
      typeof data["readingTime"] === "number"
        ? (data["readingTime"] as number)
        : estimateReadingTime(content),
    toc: data["toc"] === true,
    content,
  }
}

/** Extract ## and ### headings to build a table of contents. */
export function extractToc(content: string): TocItem[] {
  const lines = content.split("\n")
  const items: TocItem[] = []

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    const h3 = line.match(/^###\s+(.+)$/)
    const match = h3 ?? h2
    if (!match || !match[1]) continue
    const text = match[1].trim()
    items.push({ id: slugify(text), text, level: h3 ? 3 : 2 })
  }

  return items
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sÀ-ɏ-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

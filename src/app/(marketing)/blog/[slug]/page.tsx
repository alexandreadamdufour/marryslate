import { getPostBySlug, getAllPosts, extractToc } from "@/lib/blog"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import rehypeSlug from "rehype-slug"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} | Marryslate`,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const toc = post.toc ? extractToc(post.content) : []

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-12">
          {/* Article */}
          <article className="min-w-0">
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Blog
            </Link>

            <header className="mt-6">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {post.title}
              </h1>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <time dateTime={post.publishedAt}>
                  {format(new Date(post.publishedAt), "d MMMM yyyy", { locale: fr })}
                </time>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime} min de lecture
                </span>
              </div>
            </header>

            <div className="prose mt-8">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypeSlug],
                  },
                }}
              />
            </div>

            {/* CTA */}
            <div className="mt-16 rounded-2xl border border-border bg-muted/40 px-6 py-10 text-center">
              <p className="font-serif text-2xl font-semibold text-foreground">
                Prêt à créer votre site mariage ?
              </p>
              <p className="mt-2 text-muted-foreground">
                Gratuit, sans abonnement. En ligne en 5 minutes.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/inscription">Créer mon site gratuitement</Link>
              </Button>
            </div>
          </article>

          {/* TOC — sticky on xl+ */}
          {toc.length > 0 && (
            <aside className="hidden xl:block">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Sommaire
                </p>
                <nav className="mt-3 space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={[
                        "block text-sm text-muted-foreground hover:text-foreground transition-colors leading-snug",
                        item.level === 3 ? "pl-3" : "",
                      ].join(" ")}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

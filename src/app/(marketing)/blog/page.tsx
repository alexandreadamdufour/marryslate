import { getAllPosts } from "@/lib/blog"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock } from "lucide-react"

export const metadata = {
  title: "Blog — Conseils mariage | Amora",
  description:
    "Guides et conseils pour organiser votre mariage : liste de cadeaux, cagnotte, site mariage, faire-part. Tout pour que votre mariage soit parfait.",
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Guides et conseils pour organiser votre mariage sereinement.
        </p>

        <div className="mt-12 space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="group border-b border-border/50 pb-8 last:border-0">
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="font-serif text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-muted-foreground line-clamp-2">{post.description}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {format(new Date(post.publishedAt), "d MMMM yyyy", { locale: fr })}
                  </time>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime} min de lecture
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

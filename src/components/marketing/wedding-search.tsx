"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { searchWeddings, type WeddingSearchResult } from "@/actions/search"

const PAGE_SIZE = 12

interface WeddingSearchProps {
  initialResults: WeddingSearchResult[]
  initialCount: number
}

export function WeddingSearch({ initialResults, initialCount }: WeddingSearchProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [results, setResults] = useState(initialResults)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const initialRef = useRef({ results: initialResults, count: initialCount })

  // Debounce query → reset page, then trigger fetch effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch on debouncedQuery or page change
  useEffect(() => {
    if (debouncedQuery === "" && page === 1) {
      setResults(initialRef.current.results)
      setCount(initialRef.current.count)
      return
    }
    startTransition(async () => {
      const result = await searchWeddings(debouncedQuery, page)
      if (result.data !== undefined) {
        setResults(result.data)
        setCount(result.count ?? 0)
      }
    })
  }, [debouncedQuery, page])

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div className="relative mx-auto max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Rechercher par prénom (ex : Sophie, Jean…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-9 text-base"
          aria-label="Rechercher une liste de mariage par prénom"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        {isPending
          ? "Recherche…"
          : `${count} site${count !== 1 ? "s" : ""} trouvé${count !== 1 ? "s" : ""}`}
      </p>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">Aucun résultat</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Essayez avec un autre prénom.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((w) => (
            <WeddingCard key={w.id} wedding={w} />
          ))}
        </div>
      )}

      {totalPages > 1 && !isPending && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}

function WeddingCard({ wedding }: { wedding: WeddingSearchResult }) {
  const names = `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
  const date = wedding.wedding_date
    ? new Date(wedding.wedding_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 bg-muted">
        {wedding.cover_image_url ? (
          <Image
            src={wedding.cover_image_url}
            alt={`Photo de mariage de ${names}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent to-muted">
            <span className="font-serif text-4xl text-muted-foreground/40" aria-hidden="true">
              {wedding.partner1_first_name[0]}
              {wedding.partner2_first_name[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-serif text-lg font-medium leading-tight">{names}</p>
        {date && <p className="mt-0.5 text-sm text-muted-foreground">{date}</p>}
        <Button asChild size="sm" className="mt-4 w-full">
          <Link href={`/m/${wedding.slug}`}>Voir le site</Link>
        </Button>
      </div>
    </div>
  )
}

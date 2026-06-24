import Link from "next/link"
import type { Route } from "next"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Globe, Calendar, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Tables } from "@/lib/supabase/types"

interface WeddingOverviewCardProps {
  wedding: Tables<"weddings">
}

export function WeddingOverviewCard({ wedding }: WeddingOverviewCardProps) {
  const siteUrl = `/m/${wedding.slug}` as Route

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Statut du site */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Votre site</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              wedding.is_published ? "bg-green-500" : "bg-muted-foreground"
            )}
          />
          <span className="text-sm font-medium">
            {wedding.is_published ? "Publié" : "Brouillon"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/dashboard/site">Personnaliser</Link>
          </Button>
          {wedding.is_published && (
            <Button asChild variant="ghost" size="sm">
              <Link href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-label="Voir le site" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Date du mariage</span>
        </div>
        <p className="text-lg font-medium">
          {wedding.wedding_date
            ? format(new Date(wedding.wedding_date), "d MMMM yyyy", { locale: fr })
            : "Non définie"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/parametres">Modifier</Link>
        </Button>
      </div>

      {/* Adresse */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>URL du site</span>
        </div>
        <p className="text-sm font-mono text-foreground break-all">
          amora.fr/m/{wedding.slug}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={undefined}
          asChild
        >
          <Link href="/dashboard/parametres">Modifier</Link>
        </Button>
      </div>
    </div>
  )
}

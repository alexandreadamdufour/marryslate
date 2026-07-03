"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Même photo que le hero (cover_image_url réel d'alexetlouise) — réutilisée
// ici pour le bloc "Site personnalisé" avec un cadrage/traitement différent
// (pas de barre de navigateur, pour éviter le doublon visuel avec le hero).
const DEMO_WEDDING_COVER_URL =
  "https://pcmramsqelydvaekslsn.supabase.co/storage/v1/object/public/gift-images/9b3eee73-45bf-4baf-a2d7-0fa790f1660f/cover-1783003759790.jpeg"

// Vraies photos produit (gifts réels de la wedding démo alexetlouise),
// progression illustrative en dur (current_amount réel = 0€, pas présentable
// en mockup marketing) — même logique que le hero, contenu figé intentionnel.
const DEMO_GIFTS = [
  {
    title: "Voyage de noces",
    imageUrl:
      "https://pcmramsqelydvaekslsn.supabase.co/storage/v1/object/public/gift-images/gifts/alexetlouise-honeymoon.jpg",
    target: 150,
    collected: 90,
  },
  {
    title: "Lampe",
    imageUrl:
      "https://pcmramsqelydvaekslsn.supabase.co/storage/v1/object/public/gift-images/9b3eee73-45bf-4baf-a2d7-0fa790f1660f/1783003789624.jpeg",
    target: 300,
    collected: 120,
  },
]

const RSVP_GUESTS = [
  { name: "Marie D.", confirmed: true },
  { name: "Thomas L.", confirmed: true },
  { name: "Julie B.", confirmed: false },
]

// 8 sièges répartis sur un cercle (angles 0°/45°/.../315°), coordonnées
// précalculées (rayon 40% depuis le centre) — pas de calcul trigo au runtime.
const TABLE_SEATS = [
  { top: "50%", left: "90%" },
  { top: "78%", left: "78%" },
  { top: "90%", left: "50%" },
  { top: "78%", left: "22%" },
  { top: "50%", left: "10%" },
  { top: "22%", left: "22%" },
  { top: "10%", left: "50%" },
  { top: "22%", left: "78%" },
]
const FILLED_SEAT_INITIALS = ["A", "L", "M"]
const DRAGGING_SEAT_INDEX = 3

function ProgressBar({ collected, target }: { collected: number; target: number }) {
  const pct = Math.min(100, Math.round((collected / target) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function FeatureBentoGrid() {
  return (
    <div className="grid gap-4 lg:auto-rows-[minmax(0,1fr)] lg:grid-cols-6">
      {/* Bloc 1 — Site personnalisé (phare) */}
      <div className="flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border bg-primary/5 lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <div className="relative aspect-[16/9] w-full shrink-0">
          <Image
            src={DEMO_WEDDING_COVER_URL}
            alt="Aperçu du site de mariage réel d'Alex et Louise créé avec Marryslate"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-white">
            <p className="text-[10px] uppercase tracking-widest">Mariage</p>
            <p className="font-serif text-2xl sm:text-3xl">
              Alex <span className="text-primary">&amp;</span> Louise
            </p>
            <p className="font-serif text-lg text-primary">10 juillet 2026</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b bg-card px-4 py-2.5 text-xs text-muted-foreground">
          <span>Programme</span>
          <span aria-hidden="true">·</span>
          <span>RSVP</span>
          <span aria-hidden="true">·</span>
          <span>Cagnotte</span>
          <span aria-hidden="true">·</span>
          <span>Livre d&apos;or</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-6 lg:p-8">
          <h3 className="font-serif text-xl lg:text-2xl">Votre site, à votre image</h3>
          <p className="text-muted-foreground">
            Photos, programme, informations pratiques : un site complet en quelques minutes.
          </p>
          <p className="mt-auto text-xs text-muted-foreground">marryslate.com/m/votre-nom</p>
        </div>
      </div>

      {/* Bloc 2 — Cagnotte et cadeaux */}
      <div className="flex animate-fade-in-up flex-col gap-4 rounded-2xl border bg-card p-6 [animation-delay:100ms] lg:col-span-2 lg:col-start-5 lg:row-start-1">
        <div className="grid grid-cols-2 gap-3">
          {DEMO_GIFTS.map((g) => (
            <div key={g.title} className="overflow-hidden rounded-lg border bg-background">
              <div className="relative aspect-square w-full">
                <Image src={g.imageUrl} alt="" fill sizes="120px" className="object-cover" />
              </div>
              <div className="space-y-1 p-2">
                <p className="truncate text-xs font-medium">{g.title}</p>
                <ProgressBar collected={g.collected} target={g.target} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-serif text-lg">Cagnotte et cadeaux, sans enveloppes</h3>
          <p className="text-sm text-muted-foreground">
            Vos invités choisissent un cadeau ou contribuent librement, en ligne.
          </p>
        </div>
      </div>

      {/* Bloc 3 — RSVP intelligent */}
      <div className="flex animate-fade-in-up flex-col gap-4 rounded-2xl border bg-card p-6 [animation-delay:200ms] lg:col-span-2 lg:col-start-5 lg:row-start-2">
        <div className="space-y-2">
          {RSVP_GUESTS.map((g) => (
            <div
              key={g.name}
              className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <span>{g.name}</span>
              <Badge variant={g.confirmed ? "default" : "outline"}>
                {g.confirmed ? "Confirmé" : "En attente"}
              </Badge>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-serif text-lg">Qui vient, qui ne vient pas</h3>
          <p className="text-sm text-muted-foreground">
            Vos invités répondent en un clic, vous suivez tout depuis votre tableau de bord.
          </p>
        </div>
      </div>

      {/* Bloc 4 — Plan de table */}
      <div className="flex animate-fade-in-up flex-col gap-4 rounded-2xl border bg-card p-6 [animation-delay:300ms] lg:col-span-3 lg:col-start-1 lg:row-start-3">
        <div className="relative mx-auto aspect-square w-full max-w-[160px]">
          <div className="absolute inset-[22%] flex items-center justify-center rounded-full border-2 border-border bg-background text-lg font-semibold text-muted-foreground">
            5
          </div>
          {TABLE_SEATS.map((pos, i) => {
            const filledIndex = i < FILLED_SEAT_INITIALS.length ? i : -1
            const isDragging = i === DRAGGING_SEAT_INDEX
            return (
              <div
                key={i}
                aria-hidden="true"
                className={cn(
                  "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-medium",
                  filledIndex >= 0 && "bg-primary text-primary-foreground",
                  isDragging &&
                    "border-2 border-dashed border-primary/50 bg-primary/10 text-primary/50 motion-safe:animate-pulse",
                  filledIndex < 0 && !isDragging && "border border-border bg-background"
                )}
                style={{ top: pos.top, left: pos.left }}
              >
                {filledIndex >= 0 ? FILLED_SEAT_INITIALS[filledIndex] : null}
              </div>
            )
          })}
        </div>
        <div>
          <h3 className="font-serif text-lg">Le plan de table en glisser-déposer</h3>
          <p className="text-sm text-muted-foreground">Table par table, sans Excel.</p>
        </div>
      </div>

      {/* Bloc 5 — Livre d'or */}
      <div className="flex animate-fade-in-up flex-col gap-4 rounded-2xl border bg-card p-6 [animation-delay:400ms] lg:col-span-3 lg:col-start-4 lg:row-start-3">
        <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-primary"
            aria-hidden="true"
          >
            M
          </div>
          <div>
            <p className="text-sm font-medium">Marie &amp; Julien</p>
            <p className="text-xs text-muted-foreground">28 juin 2026</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hâte de célébrer ce grand jour avec vous deux !
            </p>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-lg">Les mots de vos invités</h3>
          <p className="text-sm text-muted-foreground">
            Un livre d&apos;or numérique, à garder pour toujours.
          </p>
        </div>
      </div>
    </div>
  )
}

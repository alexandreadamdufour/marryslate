"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GiftForm } from "./gift-form"
import { deleteGift, updateGift } from "@/actions/gifts"
import type { Gift } from "@/queries/gifts"

interface GiftCardProps {
  gift: Gift
  weddingId: string
}

export function GiftCard({ gift, weddingId }: GiftCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: gift.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const percent = Math.min(
    100,
    Math.round((Number(gift.current_amount) / Number(gift.target_amount)) * 100)
  )

  async function handleDelete() {
    if (!confirm(`Supprimer "${gift.title}" ?`)) return
    setDeleting(true)
    const result = await deleteGift(gift.id)
    if ("error" in result) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Cadeau supprimé", { duration: 3000 })
      router.refresh()
    }
    setDeleting(false)
  }

  async function handleToggleActive() {
    await updateGift({ giftId: gift.id, isActive: !gift.is_active })
    toast.success(gift.is_active ? "Cadeau masqué" : "Cadeau visible", { duration: 3000 })
    router.refresh()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Déplacer"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Image */}
      {gift.image_url ? (
        <Image
          src={gift.image_url}
          alt={gift.title}
          width={72}
          height={72}
          className="h-18 w-18 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{gift.title}</p>
              {!gift.is_active && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Masqué
                </Badge>
              )}
              {gift.category && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {gift.category}
                </Badge>
              )}
            </div>
            {gift.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {gift.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            {gift.external_url && (
              <a
                href={gift.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Voir le produit"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleToggleActive}
              aria-label={gift.is_active ? "Masquer" : "Afficher"}
            >
              {gift.is_active ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Modifier le cadeau</DialogTitle>
                </DialogHeader>
                <GiftForm
                  weddingId={weddingId}
                  gift={gift}
                  onSuccess={() => {
                    setEditOpen(false)
                    router.refresh()
                  }}
                />
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <Progress value={percent} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Number(gift.current_amount).toLocaleString("fr-FR")} € collectés</span>
            <span>{Number(gift.target_amount).toLocaleString("fr-FR")} € cible</span>
          </div>
        </div>
      </div>
    </div>
  )
}

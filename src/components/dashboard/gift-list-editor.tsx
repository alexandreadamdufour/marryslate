"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { sendGAEvent } from "@next/third-parties/google"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GiftCard } from "./gift-card"
import { GiftForm } from "./gift-form"
import { reorderGifts } from "@/actions/gifts"
import type { Gift } from "@/queries/gifts"

interface GiftListEditorProps {
  initialGifts: Gift[]
  weddingId: string
}

export function GiftListEditor({ initialGifts, weddingId }: GiftListEditorProps) {
  const [gifts, setGifts] = useState(initialGifts)
  const [addOpen, setAddOpen] = useState(false)
  const router = useRouter()

  // Synchronise le state local quand le Server Component passe de nouvelles données (après router.refresh())
  useEffect(() => {
    setGifts(initialGifts)
  }, [initialGifts])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = gifts.findIndex((g) => g.id === active.id)
    const newIndex = gifts.findIndex((g) => g.id === over.id)
    const reordered = arrayMove(gifts, oldIndex, newIndex)

    setGifts(reordered) // optimistic update

    const result = await reorderGifts({
      weddingId,
      positions: reordered.map((g, i) => ({ id: g.id, position: i })),
    })

    if ("error" in result) {
      setGifts(gifts) // rollback
      toast.error("Erreur lors de la réorganisation")
    }
  }

  return (
    <div className="space-y-4">
      {gifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">Aucun cadeau pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez votre premier cadeau pour commencer.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={gifts.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {gifts.map((gift) => (
                <GiftCard key={gift.id} gift={gift} weddingId={weddingId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un cadeau
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau cadeau</DialogTitle>
          </DialogHeader>
          <GiftForm
            weddingId={weddingId}
            onSuccess={() => {
              if (gifts.length === 0) sendGAEvent("event", "first_gift_created")
              setAddOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

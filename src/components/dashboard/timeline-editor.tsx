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
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarDays, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { TimelineStepForm } from "./timeline-step-form"
import { deleteTimelineStep, reorderTimeline } from "@/actions/timeline"
import type { TimelineStep } from "@/queries/timeline"

function TimelineStepCard({ step, weddingId }: { step: TimelineStep; weddingId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${step.title}" ?`)) return
    setDeleting(true)
    const result = await deleteTimelineStep(step.id)
    if (result.error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Étape supprimée", { duration: 3000 })
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border bg-card p-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity hover:opacity-100 active:cursor-grabbing group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
        aria-label="Déplacer"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {step.emoji && <span aria-hidden="true">{step.emoji}</span>}
          <span className="text-sm font-semibold text-primary">{step.time}</span>
          <span className="font-medium">{step.title}</span>
        </div>
        {step.description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{step.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l&apos;étape</DialogTitle>
            </DialogHeader>
            <TimelineStepForm
              weddingId={weddingId}
              step={step}
              onSuccess={() => {
                setEditOpen(false)
                router.refresh()
              }}
            />
          </DialogContent>
        </Dialog>

        <Button
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
  )
}

interface TimelineEditorProps {
  initialSteps: TimelineStep[]
  weddingId: string
}

export function TimelineEditor({ initialSteps, weddingId }: TimelineEditorProps) {
  const [steps, setSteps] = useState(initialSteps)
  const [addOpen, setAddOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSteps(initialSteps)
  }, [initialSteps])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(steps, oldIndex, newIndex)
    setSteps(reordered)

    const result = await reorderTimeline({
      weddingId,
      positions: reordered.map((s, i) => ({ id: s.id, position: i })),
    })
    if (result.error) {
      setSteps(steps)
      toast.error("Erreur lors de la réorganisation")
    }
  }

  return (
    <div className="space-y-4">
      {steps.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune étape pour l'instant."
          description="Ajoutez la première étape de votre journée."
          action={{ label: "Ajouter une étape", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {steps.map((step) => (
                <TimelineStepCard key={step.id} step={step} weddingId={weddingId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une étape
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle étape</DialogTitle>
          </DialogHeader>
          <TimelineStepForm
            weddingId={weddingId}
            onSuccess={() => {
              setAddOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

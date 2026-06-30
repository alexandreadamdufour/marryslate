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
import { CalendarDays, GripVertical, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { WeddingEventForm } from "./wedding-event-form"
import { deleteWeddingEvent, reorderWeddingEvents } from "@/actions/events"
import type { WeddingEvent } from "@/queries/events"

function formatEventTime(start: string | null, end: string | null): string {
  if (!start) return ""
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }
  const startTime = new Date(start).toLocaleTimeString("fr-FR", opts)
  if (!end) return startTime
  const endTime = new Date(end).toLocaleTimeString("fr-FR", opts)
  return `${startTime} – ${endTime}`
}

function formatEventDate(start: string | null): string {
  if (!start) return ""
  return new Date(start).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  })
}

function EventCard({ event, weddingId }: { event: WeddingEvent; weddingId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${event.title}" ?`)) return
    setDeleting(true)
    const result = await deleteWeddingEvent(event.id)
    if (result.error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Événement supprimé")
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 rounded-lg border bg-card p-4"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Déplacer"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{event.title}</p>
        <div className="mt-1 space-y-0.5">
          {event.start_at && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{formatEventDate(event.start_at)}</span>
              {formatEventTime(event.start_at, event.end_at) && (
                <span>· {formatEventTime(event.start_at, event.end_at)}</span>
              )}
            </div>
          )}
          {event.location_name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{event.location_name}</span>
              {event.location_address && <span>— {event.location_address}</span>}
            </div>
          )}
          {event.dress_code && (
            <p className="text-sm text-muted-foreground">Tenue : {event.dress_code}</p>
          )}
          {event.description && (
            <p className="line-clamp-1 text-sm italic text-muted-foreground">{event.description}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Modifier ${event.title}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier l&apos;événement</DialogTitle>
            </DialogHeader>
            <WeddingEventForm
              weddingId={weddingId}
              event={event}
              onSuccess={() => { setEditOpen(false); router.refresh() }}
            />
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Supprimer ${event.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface Props {
  initialEvents: WeddingEvent[]
  weddingId: string
}

export function WeddingEventsEditor({ initialEvents, weddingId }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [addOpen, setAddOpen] = useState(false)
  const router = useRouter()

  useEffect(() => { setEvents(initialEvents) }, [initialEvents])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = events.findIndex((e) => e.id === active.id)
    const newIndex = events.findIndex((e) => e.id === over.id)
    const reordered = arrayMove(events, oldIndex, newIndex)
    setEvents(reordered)

    const result = await reorderWeddingEvents({
      weddingId,
      positions: reordered.map((e, i) => ({ id: e.id, position: i })),
    })
    if (result.error) {
      setEvents(events)
      toast.error("Erreur lors de la réorganisation")
    }
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">Aucun événement pour l&apos;instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez la cérémonie, le cocktail, le dîner…
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} weddingId={weddingId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un événement
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
          </DialogHeader>
          <WeddingEventForm
            weddingId={weddingId}
            onSuccess={() => { setAddOpen(false); router.refresh() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

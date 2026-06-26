"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { assignGuest, unassignGuest, deleteSeatingTable, updateTablePosition } from "@/actions/seating"
import { SeatingGuestPanel } from "./seating-guest-panel"
import { SeatingTableNode } from "./seating-table-node"
import { SeatingAddTableDialog } from "./seating-add-table-dialog"
import type { SeatingTableWithGuests } from "@/queries/seating"
import type { Guest } from "@/queries/guests"

interface Props {
  initialTables: SeatingTableWithGuests[]
  guests: Guest[]
  weddingId: string
}

const CANVAS_W = 1100
const CANVAS_H = 700
const TABLE_STRIDE = 180

export function SeatingEditor({ initialTables, guests, weddingId }: Props) {
  const [tables, setTables] = useState(initialTables)
  const [activeDragGuestId, setActiveDragGuestId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setTables(initialTables) }, [initialTables])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (args.active.data.current?.type !== "guest") return []
    return pointerWithin(args)
  }, [])

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "guest") {
      setActiveDragGuestId(event.active.data.current.guestId as string)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event
    setActiveDragGuestId(null)

    // Table repositioning
    if (active.data.current?.type === "table") {
      const tableId = active.data.current.tableId as string
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                position_x: Math.max(0, Math.min(CANVAS_W - 180, t.position_x + Math.round(delta.x))),
                position_y: Math.max(0, Math.min(CANVAS_H - 140, t.position_y + Math.round(delta.y))),
              }
            : t,
        ),
      )
      const updated = tables.find((t) => t.id === tableId)
      if (updated) {
        updateTablePosition(
          tableId,
          Math.max(0, Math.min(CANVAS_W - 180, updated.position_x + Math.round(delta.x))),
          Math.max(0, Math.min(CANVAS_H - 140, updated.position_y + Math.round(delta.y))),
        ).catch(() => toast.error("Erreur lors du déplacement"))
      }
      return
    }

    // Guest assignment
    if (active.data.current?.type === "guest" && over?.id) {
      const guestId = active.data.current.guestId as string
      const tableId = over.id as string
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const alreadyAssigned = tables.some((t) => t.assignedGuests.some((a) => a.guestId === guestId))
      const isFull = table.assignedGuests.length >= table.capacity && !alreadyAssigned
      if (isFull) { toast.error(`Table "${table.name}" est complète.`); return }

      const result = await assignGuest({ tableId, guestId })
      if (result.error) { toast.error("Erreur lors de l'attribution."); return }
      router.refresh()
    }
  }

  async function handleUnassign(assignmentId: string) {
    const result = await unassignGuest(assignmentId)
    if (result.error) { toast.error("Erreur lors du retrait."); return }
    router.refresh()
  }

  async function handleDeleteTable(tableId: string) {
    const result = await deleteSeatingTable(tableId)
    if (result.error) { toast.error("Erreur lors de la suppression."); return }
    toast.success("Table supprimée")
    router.refresh()
  }

  const assignedGuestIds = new Set(tables.flatMap((t) => t.assignedGuests.map((a) => a.guestId)))
  const unassignedGuests = guests.filter((g) => !assignedGuestIds.has(g.id))
  const activeDragGuest = activeDragGuestId ? guests.find((g) => g.id === activeDragGuestId) : null
  const defaultX = Math.min(CANVAS_W - 200, 60 + (tables.length % 5) * TABLE_STRIDE)
  const defaultY = 60 + Math.floor(tables.length / 5) * 160

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        <SeatingGuestPanel unassignedGuests={unassignedGuests} totalGuests={guests.length} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tables.length} table{tables.length !== 1 ? "s" : ""} —{" "}
              {tables.reduce((s, t) => s + t.capacity, 0)} places
            </p>
            <SeatingAddTableDialog
              weddingId={weddingId}
              defaultPosition={{ x: defaultX, y: defaultY }}
              onCreated={() => router.refresh()}
            />
          </div>

          <div className="overflow-auto rounded-xl border bg-[radial-gradient(circle,hsl(var(--border))_1px,transparent_1px)] bg-[length:24px_24px]">
            <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
              {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une table pour commencer.
                  </p>
                </div>
              )}
              {tables.map((table) => (
                <SeatingTableNode
                  key={table.id}
                  table={table}
                  onUnassign={handleUnassign}
                  onDelete={handleDeleteTable}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragGuest && (
          <div className="flex cursor-grabbing items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-xl ring-2 ring-primary/30">
            <span className="font-medium">
              {[activeDragGuest.first_name, activeDragGuest.last_name].filter(Boolean).join(" ") || "—"}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

"use client"

import { useCallback } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SeatingTableWithGuests } from "@/queries/seating"

interface Props {
  table: SeatingTableWithGuests
  onUnassign: (assignmentId: string) => void
  onDelete: (tableId: string) => void
}

function initials(firstName: string | null, lastName: string | null) {
  const f = firstName?.[0] ?? ""
  const l = lastName?.[0] ?? ""
  return (f + l).toUpperCase() || "?"
}

export function SeatingTableNode({ table, onUnassign, onDelete }: Props) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: table.id })

  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({
    id: `table-drag-${table.id}`,
    data: { type: "table", tableId: table.id },
  })

  const mergedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setDropRef(el)
      setDragRef(el)
    },
    [setDropRef, setDragRef],
  )

  const isRound = table.shape === "round"
  const remaining = table.capacity - table.assignedGuests.length
  const isFull = remaining <= 0

  // Outer wrapper is offset -8px and padded +8px so its bounding box physically
  // includes the button at right-0 top-0 (visually identical to -right-2 -top-2).
  // This eliminates the gap that caused group-hover to drop before the cursor
  // reached the button.
  const outerStyle: React.CSSProperties = {
    position: "absolute",
    left: table.position_x - 8,
    top: table.position_y - 8,
    padding: "8px",
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <div style={outerStyle} className="group">
      {/* Delete button
          Always rendered (flex, not hidden) so it receives its own pointer events.
          Desktop: opacity-0 at rest, group-hover reveals it, and hover:opacity-100
          on the button itself keeps it visible even if group-hover drops mid-transit
          (e.g. browser clips pointer area to the circle on rounded-full).
          Touch (pointer:coarse): always fully visible. */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(table.id) }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity opacity-0 group-hover:opacity-100 hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
        aria-label={`Supprimer la table ${table.name}`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </button>

      {/* Table — draggable + droppable */}
      <div
        ref={mergedRef}
        {...listeners}
        {...attributes}
        className={cn(
          "relative flex select-none flex-col items-center justify-center gap-1 border-2 bg-card shadow-sm",
          "cursor-grab active:cursor-grabbing",
          isRound ? "h-32 w-32 rounded-full" : "h-28 w-44 rounded-2xl",
          isOver && !isFull && "border-primary bg-primary/5 ring-4 ring-primary/20",
          isOver && isFull && "border-destructive ring-4 ring-destructive/20",
          !isOver && isFull && "border-muted-foreground/30",
          !isOver && !isFull && "border-border",
          isDragging && "shadow-2xl opacity-90 ring-2 ring-primary/30",
        )}
      >
        {/* Table name */}
        <p className="px-2 text-center text-xs font-semibold leading-tight">{table.name}</p>

        {/* Capacity indicator */}
        <p className={cn("text-xs font-medium tabular-nums", isFull ? "text-muted-foreground" : "text-primary")}>
          {table.assignedGuests.length}/{table.capacity}
        </p>

        {/* Guest initials bubbles */}
        {table.assignedGuests.length > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5 px-2">
            {table.assignedGuests.slice(0, isRound ? 6 : 8).map((g) => (
              <button
                key={g.assignmentId}
                type="button"
                onClick={(e) => { e.stopPropagation(); onUnassign(g.assignmentId) }}
                title={`${g.firstName ?? ""} ${g.lastName ?? ""} — cliquer pour retirer`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary hover:bg-destructive/20 hover:text-destructive"
              >
                {initials(g.firstName, g.lastName)}
              </button>
            ))}
            {table.assignedGuests.length > (isRound ? 6 : 8) && (
              <span className="inline-flex h-5 items-center px-1 text-[9px] text-muted-foreground">
                +{table.assignedGuests.length - (isRound ? 6 : 8)}
              </span>
            )}
          </div>
        )}

        {/* Drop hint */}
        {isOver && !isFull && (
          <p className="absolute bottom-2 text-[9px] font-medium text-primary">Déposer ici</p>
        )}
        {isOver && isFull && (
          <p className="absolute bottom-2 text-[9px] font-medium text-destructive">Table complète</p>
        )}
      </div>
    </div>
  )
}

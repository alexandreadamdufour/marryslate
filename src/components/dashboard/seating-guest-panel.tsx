"use client"

import { useDraggable } from "@dnd-kit/core"
import { GripVertical, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Guest } from "@/queries/guests"

interface DraggableGuestProps {
  guest: Guest
}

function DraggableGuest({ guest }: DraggableGuestProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
    data: { type: "guest", guestId: guest.id },
  })

  const name = [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "—"

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm select-none transition-opacity",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 truncate font-medium">{name}</span>
      {guest.dietary && (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground" title={guest.dietary}>
          🍽
        </span>
      )}
    </div>
  )
}

interface Props {
  unassignedGuests: Guest[]
  totalGuests: number
}

export function SeatingGuestPanel({ unassignedGuests, totalGuests }: Props) {
  const assignedCount = totalGuests - unassignedGuests.length

  return (
    <div className="flex w-56 shrink-0 flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">Invités</p>
        <p className="text-xs text-muted-foreground">
          {assignedCount}/{totalGuests} placé{assignedCount !== 1 ? "s" : ""}
        </p>
      </div>

      {unassignedGuests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">Tous les invités sont placés !</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto">
          {unassignedGuests.map((g) => (
            <DraggableGuest key={g.id} guest={g} />
          ))}
        </div>
      )}
    </div>
  )
}

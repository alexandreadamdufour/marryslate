import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/lib/supabase/types"

export type SeatingTable = Tables<"seating_tables">

export interface AssignedGuest {
  assignmentId: string
  guestId: string
  firstName: string | null
  lastName: string | null
}

export interface SeatingTableWithGuests extends SeatingTable {
  assignedGuests: AssignedGuest[]
}

export async function getSeatingTables(weddingId: string): Promise<SeatingTableWithGuests[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("seating_tables")
    .select("*, seating_assignments(id, guest_id, guests(id, first_name, last_name))")
    .eq("wedding_id", weddingId)
    .order("created_at", { ascending: true })

  return (data ?? []).map((t) => {
    const assignments = (t.seating_assignments ?? []) as Array<{
      id: string
      guest_id: string
      guests: { id: string; first_name: string | null; last_name: string | null } | null
    }>

    return {
      id: t.id,
      wedding_id: t.wedding_id,
      name: t.name,
      capacity: t.capacity,
      shape: t.shape,
      position_x: t.position_x,
      position_y: t.position_y,
      created_at: t.created_at,
      assignedGuests: assignments.map((a) => ({
        assignmentId: a.id,
        guestId: a.guest_id,
        firstName: a.guests?.first_name ?? null,
        lastName: a.guests?.last_name ?? null,
      })),
    }
  })
}

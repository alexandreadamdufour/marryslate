"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import { logDbError } from "@/lib/supabase/log-db-error"
import {
  createSeatingTableSchema,
  updateSeatingTableSchema,
  assignGuestSchema,
  type CreateSeatingTableInput,
  type UpdateSeatingTableInput,
  type AssignGuestInput,
} from "@/lib/validators/seating"

type AR<T = void> = { data: T; error?: never } | { error: string; data?: never }

export async function createSeatingTable(input: CreateSeatingTableInput): Promise<AR<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createSeatingTableSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const { data, error } = await supabase
    .from("seating_tables")
    .insert({
      wedding_id: parsed.data.weddingId,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      shape: parsed.data.shape,
      position_x: parsed.data.positionX,
      position_y: parsed.data.positionY,
    })
    .select("id")
    .single()

  if (error ?? !data) {
    console.error("[createSeatingTable]", { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint })
    return { error: error?.message ?? "DB_ERROR" }
  }

  revalidatePath("/dashboard/plan-de-table")
  return { data: { id: data.id } }
}

export async function updateSeatingTable(input: UpdateSeatingTableInput): Promise<AR<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateSeatingTableSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { tableId, ...rest } = parsed.data

  const supabase = await createClerkSupabaseClient()
  const { data: existing } = await supabase
    .from("seating_tables")
    .select("wedding_id")
    .eq("id", tableId)
    .maybeSingle()
  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { data, error } = await supabase
    .from("seating_tables")
    .update({
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.capacity !== undefined && { capacity: rest.capacity }),
      ...(rest.shape !== undefined && { shape: rest.shape }),
      ...(rest.positionX !== undefined && { position_x: rest.positionX }),
      ...(rest.positionY !== undefined && { position_y: rest.positionY }),
    })
    .eq("id", tableId)
    .select("id")
    .single()

  if (error ?? !data) return { error: "DB_ERROR" }

  revalidatePath("/dashboard/plan-de-table")
  return { data: { id: data.id } }
}

export async function updateTablePosition(tableId: string, x: number, y: number): Promise<AR> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()
  const { data: existing } = await supabase
    .from("seating_tables")
    .select("wedding_id")
    .eq("id", tableId)
    .maybeSingle()
  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("seating_tables")
    .update({ position_x: Math.max(0, x), position_y: Math.max(0, y) })
    .eq("id", tableId)

  if (error) return { error: "DB_ERROR" }
  return { data: undefined }
}

export async function deleteSeatingTable(tableId: string): Promise<AR> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()
  const { data: existing } = await supabase
    .from("seating_tables")
    .select("wedding_id")
    .eq("id", tableId)
    .maybeSingle()
  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error: deleteError } = await supabase.from("seating_tables").delete().eq("id", tableId)
  if (deleteError) {
    logDbError("deleteSeatingTable", deleteError)
    return { error: "DB_ERROR" }
  }
  revalidatePath("/dashboard/plan-de-table")
  return { data: undefined }
}

export async function assignGuest(input: AssignGuestInput): Promise<AR<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = assignGuestSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const supabase = await createClerkSupabaseClient()
  const { data: table } = await supabase
    .from("seating_tables")
    .select("wedding_id")
    .eq("id", parsed.data.tableId)
    .maybeSingle()
  if (!table) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, table.wedding_id))) return { error: "FORBIDDEN" }

  const { data, error } = await supabase
    .from("seating_assignments")
    .upsert(
      { table_id: parsed.data.tableId, guest_id: parsed.data.guestId },
      { onConflict: "guest_id" }
    )
    .select("id")
    .single()

  if (error ?? !data) {
    console.error("[assignGuest]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/plan-de-table")
  return { data: { id: data.id } }
}

export async function unassignGuest(assignmentId: string): Promise<AR> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: row } = await supabase
    .from("seating_assignments")
    .select("table_id, seating_tables(wedding_id)")
    .eq("id", assignmentId)
    .maybeSingle()

  if (!row) return { error: "NOT_FOUND" }
  const weddingId = (row.seating_tables as { wedding_id: string } | null)?.wedding_id
  if (!weddingId) return { error: "NOT_FOUND" }

  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { error: deleteError } = await supabase.from("seating_assignments").delete().eq("id", assignmentId)
  if (deleteError) {
    logDbError("unassignGuest", deleteError)
    return { error: "DB_ERROR" }
  }
  revalidatePath("/dashboard/plan-de-table")
  return { data: undefined }
}

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
  type CreateChecklistItemInput,
  type UpdateChecklistItemInput,
} from "@/lib/validators/planner"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

export async function createChecklistItem(
  input: CreateChecklistItemInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createChecklistItemSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const { data: item, error } = await supabase
    .from("checklist_items")
    .insert({
      wedding_id: parsed.data.weddingId,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.due_date ?? null,
      priority: parsed.data.priority,
    })
    .select("id")
    .single()

  if (error ?? !item) {
    console.error("[createChecklistItem]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/planner")
  return { data: { id: item.id } }
}

export async function updateChecklistItem(
  input: UpdateChecklistItemInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateChecklistItemSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { itemId, ...rest } = parsed.data
  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("checklist_items")
    .select("wedding_id")
    .eq("id", itemId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { data: updated, error } = await supabase
    .from("checklist_items")
    .update({
      ...(rest.category !== undefined && { category: rest.category }),
      ...(rest.title !== undefined && { title: rest.title }),
      ...(rest.description !== undefined && { description: rest.description ?? null }),
      ...(rest.due_date !== undefined && { due_date: rest.due_date ?? null }),
      ...(rest.priority !== undefined && { priority: rest.priority }),
    })
    .eq("id", itemId)
    .select("id")
    .single()

  if (error ?? !updated) {
    console.error("[updateChecklistItem]", error?.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/planner")
  return { data: { id: updated.id } }
}

export async function toggleChecklistItem(
  itemId: string,
  isCompleted: boolean
): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("checklist_items")
    .select("wedding_id")
    .eq("id", itemId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("checklist_items")
    .update({ is_completed: isCompleted })
    .eq("id", itemId)

  if (error) {
    console.error("[toggleChecklistItem]", error.message)
    return { error: "DB_ERROR" }
  }

  return { data: undefined }
}

export async function deleteChecklistItem(itemId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("checklist_items")
    .select("wedding_id")
    .eq("id", itemId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("checklist_items").delete().eq("id", itemId)

  if (error) {
    console.error("[deleteChecklistItem]", error.message)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/planner")
  return { data: undefined }
}

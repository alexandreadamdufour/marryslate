"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
  type CreateBudgetItemInput,
  type UpdateBudgetItemInput,
} from "@/lib/validators/budget"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

export async function createBudgetItem(
  input: CreateBudgetItemInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createBudgetItemSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, parsed.data.weddingId))) return { error: "FORBIDDEN" }

  const { data: item, error } = await supabase
    .from("budget_items")
    .insert({
      wedding_id: parsed.data.weddingId,
      category: parsed.data.category,
      name: parsed.data.name,
      estimated_amount: parsed.data.estimatedAmount,
      actual_amount: parsed.data.actualAmount ?? null,
      paid_amount: parsed.data.paidAmount ?? 0,
      vendor: parsed.data.vendor ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single()

  if (error ?? !item) {
    logDbError("createBudgetItem", error)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/budget")
  return { data: { id: item.id } }
}

export async function updateBudgetItem(
  input: UpdateBudgetItemInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateBudgetItemSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const { itemId, ...rest } = parsed.data
  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("budget_items")
    .select("wedding_id")
    .eq("id", itemId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { data: updated, error } = await supabase
    .from("budget_items")
    .update({
      ...(rest.category !== undefined && { category: rest.category }),
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.estimatedAmount !== undefined && { estimated_amount: rest.estimatedAmount }),
      ...(rest.actualAmount !== undefined && { actual_amount: rest.actualAmount ?? null }),
      ...(rest.paidAmount !== undefined && { paid_amount: rest.paidAmount }),
      ...(rest.vendor !== undefined && { vendor: rest.vendor ?? null }),
      ...(rest.notes !== undefined && { notes: rest.notes ?? null }),
    })
    .eq("id", itemId)
    .select("id")
    .single()

  if (error ?? !updated) {
    logDbError("updateBudgetItem", error)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/budget")
  return { data: { id: updated.id } }
}

export async function deleteBudgetItem(itemId: string): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: existing } = await supabase
    .from("budget_items")
    .select("wedding_id")
    .eq("id", itemId)
    .maybeSingle()

  if (!existing) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, existing.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("budget_items").delete().eq("id", itemId)

  if (error) {
    logDbError("deleteBudgetItem", error)
    return { error: "DB_ERROR" }
  }

  revalidatePath("/dashboard/budget")
  return { data: undefined }
}

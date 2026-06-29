"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import type { Database } from "@/lib/supabase/types"
import {
  createTimelineStepSchema,
  updateTimelineStepSchema,
  reorderTimelineSchema,
  type CreateTimelineStepInput,
  type UpdateTimelineStepInput,
  type ReorderTimelineInput,
} from "@/lib/validators/timeline"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

async function getWeddingSlug(supabase: SupabaseClient<Database>, weddingId: string): Promise<string | null> {
  const { data } = await supabase.from("weddings").select("slug").eq("id", weddingId).maybeSingle()
  return data?.slug ?? null
}

function revalidateTimeline(weddingId: string, slug: string) {
  revalidatePath(`/m/${slug}`)
  revalidatePath("/dashboard/site")
}

export async function createTimelineStep(
  input: CreateTimelineStepInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createTimelineStepSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, time, title, description, emoji } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { data: last } = await supabase
    .from("wedding_timeline")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? -1) + 1

  const { data, error } = await supabase
    .from("wedding_timeline")
    .insert({ wedding_id: weddingId, time, title, description: description ?? null, emoji: emoji ?? null, position })
    .select("id")
    .single()

  if (error ?? !data) {
    logDbError("createTimelineStep", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: { id: data.id } }
}

export async function updateTimelineStep(
  input: UpdateTimelineStepInput
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateTimelineStepSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { stepId, weddingId, time, title, description, emoji } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("wedding_timeline")
    .update({ time, title, description: description ?? null, emoji: emoji ?? null })
    .eq("id", stepId)
    .eq("wedding_id", weddingId)

  if (error) {
    logDbError("updateTimelineStep", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: undefined }
}

export async function deleteTimelineStep(stepId: string): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: step } = await supabase
    .from("wedding_timeline")
    .select("wedding_id")
    .eq("id", stepId)
    .maybeSingle()

  if (!step) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, step.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("wedding_timeline").delete().eq("id", stepId)
  if (error) {
    logDbError("deleteTimelineStep", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, step.wedding_id)
  if (slug) revalidateTimeline(step.wedding_id, slug)

  return { data: undefined }
}

export async function reorderTimeline(
  input: ReorderTimelineInput
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = reorderTimelineSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, positions } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const results = await Promise.all(
    positions.map(({ id, position }) =>
      supabase.from("wedding_timeline").update({ position }).eq("id", id).eq("wedding_id", weddingId)
    )
  )

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    failed.forEach((r) => logDbError("reorderTimeline", r.error))
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: undefined }
}

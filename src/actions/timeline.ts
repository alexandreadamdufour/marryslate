"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import {
  createTimelineStepSchema,
  updateTimelineStepSchema,
  reorderTimelineSchema,
  type CreateTimelineStepInput,
  type UpdateTimelineStepInput,
  type ReorderTimelineInput,
} from "@/lib/validators/timeline"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

async function getWeddingSlug(weddingId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("weddings")
    .select("slug")
    .eq("id", weddingId)
    .maybeSingle()
  return data?.slug ?? null
}

function revalidateTimeline(weddingId: string, slug: string) {
  revalidatePath(`/m/${slug}`)
  revalidatePath("/dashboard/site")
}

export async function createTimelineStep(
  input: CreateTimelineStepInput
): Promise<ActionResult<{ id: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = createTimelineStepSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, time, title, description, emoji } = parsed.data

  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()

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

  if (error ?? !data) return { error: "DB_ERROR" }

  const slug = await getWeddingSlug(weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: { id: data.id } }
}

export async function updateTimelineStep(
  input: UpdateTimelineStepInput
): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = updateTimelineStepSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { stepId, weddingId, time, title, description, emoji } = parsed.data

  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("wedding_timeline")
    .update({ time, title, description: description ?? null, emoji: emoji ?? null })
    .eq("id", stepId)
    .eq("wedding_id", weddingId)

  if (error) return { error: "DB_ERROR" }

  const slug = await getWeddingSlug(weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: undefined }
}

export async function deleteTimelineStep(stepId: string): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: step } = await supabase
    .from("wedding_timeline")
    .select("wedding_id")
    .eq("id", stepId)
    .maybeSingle()

  if (!step) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(clerkUserId, step.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("wedding_timeline").delete().eq("id", stepId)
  if (error) return { error: "DB_ERROR" }

  const slug = await getWeddingSlug(step.wedding_id)
  if (slug) revalidateTimeline(step.wedding_id, slug)

  return { data: undefined }
}

export async function reorderTimeline(
  input: ReorderTimelineInput
): Promise<ActionResult<void>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const parsed = reorderTimelineSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, positions } = parsed.data

  if (!(await assertWeddingCoowner(clerkUserId, weddingId))) return { error: "FORBIDDEN" }

  const supabase = createAdminClient()
  await Promise.all(
    positions.map(({ id, position }) =>
      supabase.from("wedding_timeline").update({ position }).eq("id", id).eq("wedding_id", weddingId)
    )
  )

  const slug = await getWeddingSlug(weddingId)
  if (slug) revalidateTimeline(weddingId, slug)

  return { data: undefined }
}

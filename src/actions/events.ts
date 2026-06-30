"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { assertWeddingCoowner } from "@/lib/auth/assert-coowner"
import type { Database } from "@/lib/supabase/types"
import {
  createWeddingEventSchema,
  updateWeddingEventSchema,
  reorderWeddingEventsSchema,
  type CreateWeddingEventInput,
  type UpdateWeddingEventInput,
  type ReorderWeddingEventsInput,
} from "@/lib/validators/events"
import { logDbError } from "@/lib/supabase/log-db-error"

type ActionResult<T = void> = { data: T; error?: never } | { error: string; data?: never }

async function getWeddingSlug(supabase: SupabaseClient<Database>, weddingId: string): Promise<string | null> {
  const { data } = await supabase.from("weddings").select("slug").eq("id", weddingId).maybeSingle()
  return data?.slug ?? null
}

function revalidateEvents(slug: string) {
  revalidatePath("/dashboard/programme")
  revalidatePath(`/m/${slug}`)
}

export async function createWeddingEvent(
  input: CreateWeddingEventInput
): Promise<ActionResult<{ id: string }>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = createWeddingEventSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, title, startAt, endAt, locationName, locationAddress, dressCode, description } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { data: last } = await supabase
    .from("wedding_events")
    .select("position")
    .eq("wedding_id", weddingId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (last?.position ?? -1) + 1

  const { data, error } = await supabase
    .from("wedding_events")
    .insert({
      wedding_id:       weddingId,
      title,
      start_at:         startAt ?? null,
      end_at:           endAt ?? null,
      location_name:    locationName ?? null,
      location_address: locationAddress ?? null,
      dress_code:       dressCode ?? null,
      description:      description ?? null,
      position,
    })
    .select("id")
    .single()

  if (error ?? !data) {
    logDbError("createWeddingEvent", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateEvents(slug)

  return { data: { id: data.id } }
}

export async function updateWeddingEvent(
  input: UpdateWeddingEventInput
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = updateWeddingEventSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { eventId, weddingId, title, startAt, endAt, locationName, locationAddress, dressCode, description } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const { error } = await supabase
    .from("wedding_events")
    .update({
      title,
      start_at:         startAt ?? null,
      end_at:           endAt ?? null,
      location_name:    locationName ?? null,
      location_address: locationAddress ?? null,
      dress_code:       dressCode ?? null,
      description:      description ?? null,
    })
    .eq("id", eventId)
    .eq("wedding_id", weddingId)

  if (error) {
    logDbError("updateWeddingEvent", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateEvents(slug)

  return { data: undefined }
}

export async function deleteWeddingEvent(eventId: string): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: event } = await supabase
    .from("wedding_events")
    .select("wedding_id")
    .eq("id", eventId)
    .maybeSingle()

  if (!event) return { error: "NOT_FOUND" }
  if (!(await assertWeddingCoowner(supabase, event.wedding_id))) return { error: "FORBIDDEN" }

  const { error } = await supabase.from("wedding_events").delete().eq("id", eventId)
  if (error) {
    logDbError("deleteWeddingEvent", error)
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, event.wedding_id)
  if (slug) revalidateEvents(slug)

  return { data: undefined }
}

export async function reorderWeddingEvents(
  input: ReorderWeddingEventsInput
): Promise<ActionResult<void>> {
  const { userId } = await auth()
  if (!userId) return { error: "UNAUTHORIZED" }

  const parsed = reorderWeddingEventsSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { weddingId, positions } = parsed.data

  const supabase = await createClerkSupabaseClient()
  if (!(await assertWeddingCoowner(supabase, weddingId))) return { error: "FORBIDDEN" }

  const results = await Promise.all(
    positions.map(({ id, position }) =>
      supabase.from("wedding_events").update({ position }).eq("id", id).eq("wedding_id", weddingId)
    )
  )

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    failed.forEach((r) => logDbError("reorderWeddingEvents", r.error))
    return { error: "DB_ERROR" }
  }

  const slug = await getWeddingSlug(supabase, weddingId)
  if (slug) revalidateEvents(slug)

  return { data: undefined }
}

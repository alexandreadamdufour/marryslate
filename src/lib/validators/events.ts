import { z } from "zod"

const baseEventSchema = z.object({
  title:           z.string().min(1, "Le titre est requis").max(100).trim(),
  startAt:         z.string().nullable().optional(),
  endAt:           z.string().nullable().optional(),
  locationName:    z.string().max(150).trim().nullable().optional(),
  locationAddress: z.string().max(300).trim().nullable().optional(),
  dressCode:       z.string().max(100).trim().nullable().optional(),
  description:     z.string().max(500).trim().nullable().optional(),
})

export const createWeddingEventSchema = baseEventSchema.extend({
  weddingId: z.string().uuid(),
})

export const updateWeddingEventSchema = baseEventSchema.extend({
  eventId:   z.string().uuid(),
  weddingId: z.string().uuid(),
})

export const reorderWeddingEventsSchema = z.object({
  weddingId: z.string().uuid(),
  positions: z.array(z.object({
    id:       z.string().uuid(),
    position: z.number().int().min(0),
  })),
})

export type CreateWeddingEventInput = z.infer<typeof createWeddingEventSchema>
export type UpdateWeddingEventInput = z.infer<typeof updateWeddingEventSchema>
export type ReorderWeddingEventsInput = z.infer<typeof reorderWeddingEventsSchema>

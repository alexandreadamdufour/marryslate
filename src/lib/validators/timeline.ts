import { z } from "zod"

const baseStepSchema = z.object({
  time: z.string().min(1, "L'heure est requise").max(20).trim(),
  title: z.string().min(1, "Le titre est requis").max(100).trim(),
  description: z.string().max(500).trim().optional(),
  emoji: z.string().max(10).trim().optional(),
})

export const createTimelineStepSchema = baseStepSchema.extend({
  weddingId: z.string().uuid(),
})

export const updateTimelineStepSchema = baseStepSchema.extend({
  stepId: z.string().uuid(),
  weddingId: z.string().uuid(),
})

export const reorderTimelineSchema = z.object({
  weddingId: z.string().uuid(),
  positions: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0),
  })),
})

export type CreateTimelineStepInput = z.infer<typeof createTimelineStepSchema>
export type UpdateTimelineStepInput = z.infer<typeof updateTimelineStepSchema>
export type ReorderTimelineInput = z.infer<typeof reorderTimelineSchema>

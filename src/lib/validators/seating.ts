import { z } from "zod"

export const TABLE_SHAPES = ["round", "rectangle"] as const
export const TABLE_SHAPE_LABELS: Record<(typeof TABLE_SHAPES)[number], string> = {
  round: "Ronde",
  rectangle: "Rectangle",
}

export const createSeatingTableSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1, "Requis").max(50),
  capacity: z.coerce.number().int().min(1).max(50).default(8),
  shape: z.enum(TABLE_SHAPES).default("round"),
  positionX: z.number().int().default(100),
  positionY: z.number().int().default(100),
})

export const updateSeatingTableSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  capacity: z.coerce.number().int().min(1).max(50).optional(),
  shape: z.enum(TABLE_SHAPES).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
})

export const assignGuestSchema = z.object({
  tableId: z.string().uuid(),
  guestId: z.string().uuid(),
})

export type CreateSeatingTableInput = z.infer<typeof createSeatingTableSchema>
export type UpdateSeatingTableInput = z.infer<typeof updateSeatingTableSchema>
export type AssignGuestInput = z.infer<typeof assignGuestSchema>

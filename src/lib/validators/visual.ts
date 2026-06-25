import { z } from "zod"
import { WEDDING_FONTS } from "@/lib/constants"

const FONT_VALUES = WEDDING_FONTS.map((f) => f.value) as [string, ...string[]]

export const updateWeddingVisualSchema = z.object({
  weddingId: z.string().uuid(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format hexadécimal attendu (ex: #C4714A)")
    .optional()
    .nullable(),
  fontFamily: z.enum(FONT_VALUES).optional().nullable(),
})

export type UpdateWeddingVisualInput = z.infer<typeof updateWeddingVisualSchema>

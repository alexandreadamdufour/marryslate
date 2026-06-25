import { z } from "zod"
import { SLUG_REGEX, MIN_SLUG_LENGTH, MAX_SLUG_LENGTH } from "@/lib/constants"

export const slugSchema = z
  .string()
  .min(MIN_SLUG_LENGTH, `Minimum ${MIN_SLUG_LENGTH} caractères`)
  .max(MAX_SLUG_LENGTH, `Maximum ${MAX_SLUG_LENGTH} caractères`)
  .regex(SLUG_REGEX, "Lettres minuscules, chiffres et tirets uniquement")

export const createWeddingSchema = z.object({
  partner1FirstName: z.string().min(1, "Requis").max(50),
  partner2FirstName: z.string().min(1, "Requis").max(50),
  weddingDate: z.string().optional(),
  slug: slugSchema,
})

export const updateWeddingSchema = z.object({
  weddingId: z.string().uuid(),
  partner1FirstName: z.string().min(1).max(50).optional(),
  partner2FirstName: z.string().min(1).max(50).optional(),
  weddingDate: z.string().optional(),
  slug: slugSchema.optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  themeId: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Format hexadécimal attendu")
    .optional()
    .nullable(),
  storyMd: z.string().max(10_000).optional().nullable(),
  isPublished: z.boolean().optional(),
  rsvpEnabled: z.boolean().optional(),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>

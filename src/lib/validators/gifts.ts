import { z } from "zod"
import {
  MAX_GIFT_AMOUNT,
  MIN_GIFT_AMOUNT,
  MAX_GIFT_TITLE_LENGTH,
  MAX_GIFT_DESCRIPTION_LENGTH,
} from "@/lib/constants"

export const createGiftSchema = z.object({
  weddingId: z.string().uuid(),
  title: z.string().min(1, "Requis").max(MAX_GIFT_TITLE_LENGTH),
  description: z.string().max(MAX_GIFT_DESCRIPTION_LENGTH).optional().nullable(),
  targetAmount: z
    .number({ invalid_type_error: "Montant requis" })
    .min(MIN_GIFT_AMOUNT, `Minimum ${MIN_GIFT_AMOUNT} €`)
    .max(MAX_GIFT_AMOUNT, `Maximum ${MAX_GIFT_AMOUNT} €`),
  imageUrl: z.string().url().optional().nullable(),
  externalUrl: z.string().url("URL invalide").optional().nullable(),
  category: z.string().max(50).optional().nullable(),
})

export const updateGiftSchema = createGiftSchema.partial().extend({
  giftId: z.string().uuid(),
  isActive: z.boolean().optional(),
})

export const reorderGiftsSchema = z.object({
  weddingId: z.string().uuid(),
  positions: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })),
})

export type CreateGiftInput = z.infer<typeof createGiftSchema>
export type UpdateGiftInput = z.infer<typeof updateGiftSchema>
export type ReorderGiftsInput = z.infer<typeof reorderGiftsSchema>

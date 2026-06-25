import { z } from "zod"

export const createContributionSchema = z.object({
  weddingSlug: z.string().min(1),
  giftId: z.string().uuid().optional().nullable(),
  guestName: z.string().min(1, "Votre prénom est requis").max(100),
  guestEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  guestMessage: z.string().max(500).optional(),
  contributorPhotoUrl: z.string().url().optional().nullable(),
  grossAmountEuros: z.number().min(5, "Minimum 5 €").max(5000, "Maximum 5 000 €"),
  isAnonymous: z.boolean().default(false),
})

export type CreateContributionInput = z.infer<typeof createContributionSchema>

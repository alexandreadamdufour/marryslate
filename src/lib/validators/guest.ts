import { z } from "zod"

export const WEDDING_SIDES = ["partner1", "partner2", "both"] as const
export const RSVP_STATUSES = ["pending", "accepted", "declined", "maybe"] as const

export const RSVP_STATUS_LABELS: Record<(typeof RSVP_STATUSES)[number], string> = {
  pending: "En attente",
  accepted: "Confirmé",
  declined: "Décliné",
  maybe: "Peut-être",
}

export const SIDE_LABELS: Record<(typeof WEDDING_SIDES)[number], string> = {
  partner1: "Côté marié·e 1",
  partner2: "Côté marié·e 2",
  both: "Les deux",
}

export const createGuestSchema = z.object({
  weddingId: z.string().uuid(),
  firstName: z.string().min(1, "Requis").max(100).nullable().optional(),
  lastName: z.string().min(1, "Requis").max(100).nullable().optional(),
  email: z.union([z.string().email("Email invalide").max(320), z.literal("")]).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  groupName: z.string().max(80).optional().nullable(),
  side: z.enum(WEDDING_SIDES).optional(),
  dietary: z.string().max(300).optional().nullable(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().max(100).optional().nullable(),
  invitationSent: z.boolean().optional(),
  rsvpStatus: z.enum(RSVP_STATUSES).optional(),
  notes: z.string().max(500).optional().nullable(),
})

export const updateGuestSchema = createGuestSchema
  .omit({ weddingId: true })
  .partial()
  .extend({ guestId: z.string().uuid() })

export const importGuestsSchema = z.object({
  weddingId: z.string().uuid(),
  guests: z.array(createGuestSchema.omit({ weddingId: true })).min(1).max(500),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type ImportGuestsInput = z.infer<typeof importGuestsSchema>

import { z } from "zod"

export const submitRsvpSchema = z.object({
  weddingId: z.string().uuid(),
  firstName: z.string().min(1, "Requis").max(100),
  lastName: z.string().min(1, "Requis").max(100),
  email: z.string().email("Email invalide").min(1, "Requis").max(320),
  attending: z.boolean({ required_error: "Requis" }),
  guestCount: z.coerce.number().int().min(1, "Minimum 1 personne").max(20).default(1),
  dietary: z.string().max(500).optional(),
  message: z.string().max(1000).optional(),
})

export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>

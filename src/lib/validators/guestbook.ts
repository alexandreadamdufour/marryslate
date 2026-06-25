import { z } from "zod"

export const submitGuestbookSchema = z.object({
  weddingId: z.string().uuid(),
  authorName: z.string().min(1, "Votre prénom est requis").max(100),
  message: z
    .string()
    .min(1, "Le message est requis")
    .max(2000, "2000 caractères maximum"),
})

export type SubmitGuestbookInput = z.infer<typeof submitGuestbookSchema>

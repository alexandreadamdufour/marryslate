import { z } from "zod"

const codeField = z
  .string()
  .min(4, "Minimum 4 caractères")
  .max(8, "Maximum 8 caractères")
  .regex(/^[a-zA-Z0-9]+$/, "Lettres et chiffres uniquement")

export const updateAccessCodeSchema = z
  .object({
    weddingId: z.string().uuid(),
    enabled: z.boolean(),
    code: codeField.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.enabled && (!data.code || data.code.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Code requis (4-8 caractères) pour activer le verrou",
        path: ["code"],
      })
    }
  })

export type UpdateAccessCodeInput = z.infer<typeof updateAccessCodeSchema>

export const validateAccessCodeSchema = z.object({
  slug: z.string().min(1).max(100),
  code: z.string().min(1).max(8),
})

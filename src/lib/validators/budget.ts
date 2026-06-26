import { z } from "zod"

export const BUDGET_CATEGORIES = [
  "Lieu de réception",
  "Traiteur",
  "Photographie",
  "Vidéo",
  "Musique",
  "Fleurs & décoration",
  "Robe & tenues",
  "Coiffure & maquillage",
  "Faire-parts",
  "Transport",
  "Voyage de noces",
  "Divers",
] as const

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]

const amountField = z
  .number({ invalid_type_error: "Montant requis" })
  .min(0, "Minimum 0 €")
  .max(500_000, "Maximum 500 000 €")

export const createBudgetItemSchema = z.object({
  weddingId: z.string().uuid(),
  category: z.string().min(1, "Catégorie requise"),
  name: z.string().min(1, "Nom requis").max(120),
  estimatedAmount: amountField,
  actualAmount: amountField.nullable().optional(),
  paidAmount: amountField.optional(),
  vendor: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const updateBudgetItemSchema = createBudgetItemSchema
  .omit({ weddingId: true })
  .partial()
  .extend({ itemId: z.string().uuid() })

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>

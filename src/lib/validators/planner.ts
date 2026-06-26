import { z } from "zod"

export const PLANNER_CATEGORIES = [
  "12+ mois avant",
  "6-12 mois avant",
  "3-6 mois avant",
  "1-3 mois avant",
  "Jour J",
] as const

export type PlannerCategory = (typeof PLANNER_CATEGORIES)[number]

export const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
}

export const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
}

export const DEFAULT_CHECKLIST: Array<{
  category: string
  title: string
  priority: "high" | "medium" | "low"
}> = [
  { category: "12+ mois avant", title: "Fixer la date du mariage", priority: "high" },
  { category: "12+ mois avant", title: "Définir le budget global", priority: "high" },
  { category: "12+ mois avant", title: "Réserver le lieu de réception", priority: "high" },
  { category: "12+ mois avant", title: "Choisir et réserver le traiteur", priority: "high" },
  { category: "12+ mois avant", title: "Réserver le photographe", priority: "high" },
  { category: "6-12 mois avant", title: "Choisir la robe / tenue des mariés", priority: "high" },
  { category: "6-12 mois avant", title: "Réserver le DJ ou groupe de musique", priority: "medium" },
  { category: "6-12 mois avant", title: "Établir la liste définitive des invités", priority: "high" },
  { category: "6-12 mois avant", title: "Commander les faire-parts", priority: "medium" },
  { category: "6-12 mois avant", title: "Réserver le vidéaste", priority: "medium" },
  { category: "3-6 mois avant", title: "Envoyer les faire-parts", priority: "high" },
  { category: "3-6 mois avant", title: "Dégustation avec le traiteur", priority: "medium" },
  { category: "3-6 mois avant", title: "Choisir les alliances", priority: "high" },
  { category: "3-6 mois avant", title: "Réserver coiffeur et maquilleur", priority: "medium" },
  { category: "3-6 mois avant", title: "Planifier le voyage de noces", priority: "medium" },
  { category: "1-3 mois avant", title: "Confirmer tous les prestataires", priority: "high" },
  { category: "1-3 mois avant", title: "Créer le plan de table", priority: "medium" },
  { category: "1-3 mois avant", title: "Commander le gâteau de mariage", priority: "medium" },
  { category: "1-3 mois avant", title: "Préparer les discours et animations", priority: "low" },
  { category: "Jour J", title: "Checklist du matin : tenues, alliances, bouquets", priority: "high" },
]

const priorityEnum = z.enum(["high", "medium", "low"])

export const createChecklistItemSchema = z.object({
  weddingId: z.string().uuid(),
  category: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  priority: priorityEnum.default("medium"),
})

export const updateChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  category: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  priority: priorityEnum.optional(),
})

export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>

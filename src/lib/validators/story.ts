import { z } from "zod"

export const updateStorySchema = z.object({
  weddingId: z.string().uuid(),
  storyTitle: z.string().max(120).optional(),
  storyText: z.string().max(10_000).optional(),
  storyImages: z.array(z.string().url()).max(3).optional(),
})

export type UpdateStoryInput = z.infer<typeof updateStorySchema>

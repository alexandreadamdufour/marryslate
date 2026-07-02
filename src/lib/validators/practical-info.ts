import { z } from "zod"

const urlOrEmpty = z
  .string()
  .max(500)
  .refine(
    (v) => !v || v.startsWith("http://") || v.startsWith("https://"),
    "L'URL doit commencer par https://"
  )

const venueSchema = z.object({
  name: z.string().max(150),
  address: z.string().max(300),
  maps_url: urlOrEmpty,
})

const accommodationSchema = z.object({
  name: z.string().min(1, "Nom requis").max(150),
  address: z.string().max(300),
  booking_url: urlOrEmpty,
  price_range: z.string().max(50),
  distance: z.string().max(100),
})

export const updatePracticalInfoSchema = z.object({
  weddingId: z.string().uuid(),
  venue_ceremony: venueSchema,
  venue_reception: venueSchema,
  dress_code: z.string().max(500),
  accommodations: z.array(accommodationSchema).max(8, "8 hébergements maximum"),
})

export type UpdatePracticalInfoInput = z.infer<typeof updatePracticalInfoSchema>
export type VenueInfo = z.infer<typeof venueSchema>
export type AccommodationInfo = z.infer<typeof accommodationSchema>

export interface PracticalInfo {
  venue_ceremony?: VenueInfo
  venue_reception?: VenueInfo
  dress_code?: string
  accommodations?: AccommodationInfo[]
}

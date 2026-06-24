export const APP_NAME = "Amora"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export const MAX_GIFT_AMOUNT = 50_000
export const MIN_GIFT_AMOUNT = 1
export const MAX_GIFT_TITLE_LENGTH = 120
export const MAX_GIFT_DESCRIPTION_LENGTH = 2_000

export const MAX_SLUG_LENGTH = 60
export const MIN_SLUG_LENGTH = 3
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const MAX_GUESTBOOK_MESSAGE_LENGTH = 2_000

export const COMMISSION_RATE = 0.029
export const COMMISSION_FIXED = 0.3

export const ONBOARDING_STEPS = 4

export const WEDDING_THEMES = [
  { id: "classic", label: "Classique" },
  { id: "contemporary", label: "Contemporain" },
] as const

export type WeddingThemeId = (typeof WEDDING_THEMES)[number]["id"]

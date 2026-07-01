export const APP_NAME = "Marryslate"
// Volontairement en process.env direct : ce fichier est importé côté client, ne peut pas
// passer par @/lib/env (secrets serveur).
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

export const WEDDING_COLORS = [
  { label: "Terracotta",    value: "#C4714A" },
  { label: "Blanc cassé",   value: "#F5F0E8" },
  { label: "Sauge",         value: "#8A9E7B" },
  { label: "Bleu marine",   value: "#2C3E6B" },
  { label: "Bordeaux",      value: "#7A2638" },
  { label: "Noir",          value: "#1A1A1A" },
  { label: "Or",            value: "#C9A84C" },
  { label: "Rose poudré",   value: "#E8B4B8" },
  { label: "Lavande",       value: "#9B8EC4" },
  { label: "Vert forêt",    value: "#2D5A4B" },
  { label: "Gris ardoise",  value: "#6B7A8D" },
  { label: "Nude",          value: "#D4B8A0" },
] as const

export type WeddingColorValue = (typeof WEDDING_COLORS)[number]["value"]

export const WEDDING_FONTS = [
  { label: "Fraunces",            value: "Fraunces",           cssVar: "--font-fraunces",   generic: "serif" },
  { label: "Playfair Display",    value: "Playfair Display",   cssVar: "--font-playfair",   generic: "serif" },
  { label: "Cormorant Garamond",  value: "Cormorant Garamond", cssVar: "--font-cormorant",  generic: "serif" },
  { label: "Great Vibes",         value: "Great Vibes",        cssVar: "--font-greatvibes", generic: "cursive" },
  { label: "Montserrat",          value: "Montserrat",         cssVar: "--font-montserrat", generic: "sans-serif" },
  { label: "Lora",                value: "Lora",               cssVar: "--font-lora",       generic: "serif" },
] as const

export type WeddingFontValue = (typeof WEDDING_FONTS)[number]["value"]

export function getWeddingFontCss(fontValue: string): string {
  const font = WEDDING_FONTS.find((f) => f.value === fontValue)
  if (!font) return `var(--font-fraunces), 'Fraunces', Georgia, serif`
  return `var(${font.cssVar}), '${font.value}', ${font.generic}`
}

export const GIFT_CATEGORIES = [
  { value: "Cuisine", label: "Cuisine" },
  { value: "Voyage", label: "Voyage" },
  { value: "Maison", label: "Maison" },
  { value: "Expériences", label: "Expériences" },
  { value: "Loisirs", label: "Loisirs" },
  { value: "Autre", label: "Autre" },
] as const

export type GiftCategory = (typeof GIFT_CATEGORIES)[number]["value"]

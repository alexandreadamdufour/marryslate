import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs, undeclaredVariableForCiTest))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export function formatAmountEuros(euros: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(euros)
}

export function computeFee(grossAmount: number): { fee: number; net: number } {
  const fee = Math.round((grossAmount * 0.029 + 0.3) * 100) / 100
  const net = Math.round((grossAmount - fee) * 100) / 100
  return { fee, net }
}

function hexToHslParts(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const r = parseInt(m[1]!.slice(0, 2), 16) / 255
  const g = parseInt(m[1]!.slice(2, 4), 16) / 255
  const b = parseInt(m[1]!.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** Converts a #RRGGBB hex to "H S% L%" string for CSS custom properties. */
export function hexToCssHsl(hex: string): string | null {
  const parts = hexToHslParts(hex)
  if (!parts) return null
  return `${parts.h} ${parts.s}% ${parts.l}%`
}

/**
 * Returns an HSL string for a high-contrast foreground against the given hex color.
 * Light colors → dark foreground; dark/saturated → light foreground.
 */
export function hexGetForeground(hex: string): string {
  const parts = hexToHslParts(hex)
  if (!parts) return "36 33% 97%"
  return parts.l > 55 ? "20 14% 15%" : "36 33% 97%"
}

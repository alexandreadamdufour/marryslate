"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { useSitePreview } from "./site-preview-context"
import { hexToCssHsl, hexGetForeground } from "@/lib/utils"
import { getWeddingFontCss } from "@/lib/constants"

export function SitePreview() {
  const { preview } = useSitePreview()
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    if (!preview.date) {
      setDays(null)
      return
    }
    const [y, m, d] = preview.date.split("-").map(Number)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(y!, (m ?? 1) - 1, d ?? 1)
    setDays(Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }, [preview.date])

  const hsl = hexToCssHsl(preview.color) ?? "17 54% 53%"
  const fgHsl = hexGetForeground(preview.color)
  const fontCss = getWeddingFontCss(preview.fontFamily)

  const formattedDate = preview.date
    ? (() => {
        const [y, m, d] = preview.date.split("-").map(Number)
        return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      })()
    : null

  return (
    <div
      className="relative overflow-hidden rounded-2xl border shadow-sm"
      style={
        {
          "--primary": hsl,
          "--primary-foreground": fgHsl,
        } as React.CSSProperties
      }
    >
      {/* Badge Aperçu */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        <Eye className="h-3 w-3" aria-hidden="true" />
        Aperçu
      </div>

      {/* Contenu preview */}
      <div
        className="flex min-h-72 flex-col items-center justify-center gap-3 bg-primary/[0.07] px-8 py-12 text-center"
        aria-hidden="true"
      >
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary/80">
          Mariage
        </p>

        <p
          className="text-4xl font-normal leading-tight text-foreground"
          style={{ fontFamily: fontCss }}
        >
          {preview.partner1 || (
            <span className="italic opacity-30">Prénom 1</span>
          )}
          <span className="mx-3 opacity-40">&amp;</span>
          {preview.partner2 || (
            <span className="italic opacity-30">Prénom 2</span>
          )}
        </p>

        {days !== null && days > 0 && (
          <p className="text-4xl font-semibold text-primary" aria-label={`Dans ${days} jours`}>
            J&#8209;{days}
          </p>
        )}
        {days !== null && days <= 0 && (
          <p className="text-sm text-muted-foreground">Nous sommes mariés&nbsp;!</p>
        )}

        {formattedDate && (
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        )}

        <div className="mt-1 h-px w-12 bg-primary/30" />
      </div>
    </div>
  )
}

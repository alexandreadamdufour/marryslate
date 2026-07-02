"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { WEDDING_COLORS, WEDDING_FONTS } from "@/lib/constants"
import { updateWeddingVisual } from "@/actions/visual"
import { useSitePreview } from "./site-preview-context"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

const PRESET_VALUES = WEDDING_COLORS.map((c) => c.value)

export function VisualForm({ wedding }: Props) {
  const defaultColor = wedding.primary_color ?? "#C4714A"
  const isCustomDefault = !PRESET_VALUES.includes(defaultColor as typeof PRESET_VALUES[number])

  const [color, setColor] = useState(defaultColor)
  const [customHex, setCustomHex] = useState(isCustomDefault ? defaultColor : "")
  const [showCustom, setShowCustom] = useState(isCustomDefault)
  const [fontFamily, setFontFamily] = useState(wedding.font_family ?? "Fraunces")
  const [saving, setSaving] = useState(false)
  const { updatePreview } = useSitePreview()

  const HEX_RE = /^#[0-9a-fA-F]{6}$/

  function handlePresetClick(value: string) {
    setColor(value)
    setShowCustom(false)
    setCustomHex("")
    updatePreview({ color: value })
  }

  function handleCustomToggle() {
    setShowCustom(true)
    if (!isCustomDefault) setCustomHex(color)
  }

  function handleCustomChange(v: string) {
    setCustomHex(v)
    if (HEX_RE.test(v)) {
      setColor(v)
      updatePreview({ color: v })
    }
  }

  async function handleSave() {
    if (showCustom && !HEX_RE.test(customHex)) {
      toast.error("Format hexadécimal invalide (ex: #C4714A)")
      return
    }
    setSaving(true)
    const result = await updateWeddingVisual({
      weddingId: wedding.id,
      primaryColor: color,
      fontFamily,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
    } else {
      toast.success("Apparence enregistrée", { duration: 3000 })
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      {/* Couleur principale */}
      <div className="space-y-3">
        <p className="text-sm font-medium leading-none">Couleur principale</p>
        <div className="flex flex-wrap gap-2">
          {WEDDING_COLORS.map((preset) => {
            const isActive = !showCustom && color === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                aria-label={preset.label}
                aria-pressed={isActive}
                onClick={() => handlePresetClick(preset.value)}
                className={cn(
                  "relative h-8 w-8 rounded-full border-2 transition-all",
                  isActive ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: preset.value }}
              >
                {isActive && (
                  <Check
                    className="absolute inset-0 m-auto h-4 w-4 drop-shadow-sm"
                    style={{ color: preset.value === "#F5F0E8" || preset.value === "#D4B8A0" || preset.value === "#E8B4B8" ? "#1A1A1A" : "#ffffff" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}

          {/* Bouton couleur personnalisée */}
          <button
            type="button"
            aria-label="Couleur personnalisée"
            aria-pressed={showCustom}
            onClick={handleCustomToggle}
            className={cn(
              "h-8 w-8 rounded-full border-2 bg-[conic-gradient(from_0deg,_#ff0000,_#ffff00,_#00ff00,_#00ffff,_#0000ff,_#ff00ff,_#ff0000)] transition-all",
              showCustom ? "border-foreground scale-110" : "border-transparent hover:scale-105"
            )}
          />
        </div>

        {showCustom && (
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 shrink-0 rounded-full border"
              style={{ backgroundColor: HEX_RE.test(customHex) ? customHex : "#cccccc" }}
              aria-hidden="true"
            />
            <Input
              value={customHex}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="#C4714A"
              className="w-36 font-mono text-sm"
              maxLength={7}
            />
            {HEX_RE.test(customHex) && (
              <span className="text-xs text-muted-foreground">Valide</span>
            )}
          </div>
        )}
      </div>

      {/* Police de titres */}
      <div className="space-y-3">
        <p className="text-sm font-medium leading-none">Police de titres</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WEDDING_FONTS.map((font) => {
            const isActive = fontFamily === font.value
            return (
              <button
                key={font.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setFontFamily(font.value)
                  updatePreview({ fontFamily: font.value })
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span
                  className="text-2xl leading-none"
                  style={{ fontFamily: `var(${font.cssVar}), ${font.generic}` }}
                  aria-hidden="true"
                >
                  Aa
                </span>
                <span className="text-xs text-muted-foreground">{font.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </div>
  )
}

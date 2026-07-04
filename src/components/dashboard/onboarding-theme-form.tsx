"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WEDDING_THEMES, type WeddingThemeId } from "@/lib/constants"

export function OnboardingThemeForm() {
  const router = useRouter()
  const [selected, setSelected] = useState<WeddingThemeId>("classic")

  function onSubmit() {
    const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, themeId: selected }))
    router.push("/onboarding/etape-5")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {WEDDING_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelected(theme.id)}
            aria-pressed={selected === theme.id}
            aria-label={`Choisir le thème ${theme.label}`}
            className={cn(
              "relative overflow-hidden rounded-xl border-2 text-left transition-colors",
              selected === theme.id ? "border-primary" : "border-border"
            )}
          >
            {selected === theme.id && (
              <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
            <div
              className={cn(
                theme.id === "classic" ? "theme-classic" : "theme-contemporary",
                "flex flex-col gap-1 bg-background p-4"
              )}
            >
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Alex &amp; Louise
              </span>
              <h3 className="text-lg text-foreground">Notre mariage</h3>
              <div className="mt-1 h-1.5 w-10 rounded-full bg-primary" />
            </div>
            <p className="border-t px-4 py-3 text-sm font-medium">{theme.label}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          Retour
        </Button>
        <Button type="button" className="flex-1" onClick={onSubmit}>
          Suivant
        </Button>
      </div>
    </div>
  )
}

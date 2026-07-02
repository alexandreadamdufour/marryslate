"use client"

import { useEffect } from "react"
import { sendGAEvent } from "@next/third-parties/google"

// Monté uniquement sur /onboarding/etape-4, atteinte seulement après un
// createWedding réussi (redirect côté onboarding-step3-form.tsx) — la simple
// présence sur cette page suffit à signaler la conversion, pas de check
// supplémentaire nécessaire.
export function OnboardingCompleteTracker() {
  useEffect(() => {
    sendGAEvent("event", "sign_up")
  }, [])

  return null
}

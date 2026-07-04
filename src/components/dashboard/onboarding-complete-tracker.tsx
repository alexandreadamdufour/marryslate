"use client"

import { useEffect } from "react"
import { sendGAEvent } from "@/lib/ga-client-event"

// Monté uniquement sur /onboarding/etape-6, atteinte seulement après un
// createWedding réussi (redirect côté onboarding-step3-form.tsx) — la simple
// présence sur cette page suffit à signaler la conversion, pas de check
// supplémentaire nécessaire.
export function OnboardingCompleteTracker() {
  useEffect(() => {
    sendGAEvent("event", "sign_up")

    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL
    if (adsId && label) {
      sendGAEvent("event", "conversion", { send_to: `${adsId}/${label}` })
    }
  }, [])

  return null
}

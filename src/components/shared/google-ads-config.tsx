"use client"

import { useEffect } from "react"
import { sendGAEvent } from "@next/third-parties/google"

interface Props {
  adsId: string
}

// sendGAEvent pousse dans le même dataLayer que gtag.js (déjà bootstrap par
// <GoogleAnalytics>) — équivalent à gtag('config', adsId) sans charger un
// second script. Monté une fois seulement (deps [adsId], pas à chaque
// navigation contrairement à GoogleAnalyticsPageview) : enregistre le tag
// Ads sitewide pour bâtir l'audience remarketing même sans conversion.
export function GoogleAdsConfig({ adsId }: Props) {
  useEffect(() => {
    sendGAEvent("config", adsId)
  }, [adsId])

  return null
}

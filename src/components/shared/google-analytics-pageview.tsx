"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { sendGAEvent } from "@next/third-parties/google"

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    sendGAEvent("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
    })
  }, [pathname, searchParams])

  return null
}

// Wrappé en interne : useSearchParams() exige un Suspense en App Router,
// évite d'imposer ce détail à l'appelant (layout.tsx).
export function GoogleAnalyticsPageview() {
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  )
}

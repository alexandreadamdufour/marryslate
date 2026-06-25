"use client"

import { useEffect } from "react"
import { trackWeddingView } from "@/actions/analytics"

interface Props {
  weddingSlug: string
}

export function ViewTracker({ weddingSlug }: Props) {
  useEffect(() => {
    trackWeddingView(weddingSlug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

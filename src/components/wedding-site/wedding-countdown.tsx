"use client"

import { useState, useEffect } from "react"

interface WeddingCountdownProps {
  weddingDate: string
}

export function WeddingCountdown({ weddingDate }: WeddingCountdownProps) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(weddingDate)
    target.setHours(0, 0, 0, 0)
    setDays(Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  }, [weddingDate])

  // Placeholder stable pendant l'hydratation — évite le layout shift
  if (days === null) return <div className="h-14" aria-hidden="true" />

  if (days <= 0) {
    return (
      <p className="text-lg font-medium opacity-80 sm:text-xl">
        Nous sommes mariés&nbsp;!
      </p>
    )
  }

  return (
    <p
      className="font-serif text-5xl font-semibold text-primary sm:text-6xl"
      aria-label={`Dans ${days} jour${days > 1 ? "s" : ""}`}
    >
      J&#8209;{days}
    </p>
  )
}

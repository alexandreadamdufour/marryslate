"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-serif">Une erreur est survenue</h2>
      <p className="text-sm text-muted-foreground">Veuillez réessayer ou contacter le support.</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}

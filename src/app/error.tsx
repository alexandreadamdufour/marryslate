"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-2xl font-serif">Une erreur est survenue</h1>
      <p className="max-w-sm text-muted-foreground">
        Quelque chose s&apos;est mal passé. Veuillez réessayer.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}

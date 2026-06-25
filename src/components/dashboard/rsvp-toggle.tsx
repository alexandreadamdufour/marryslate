"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { updateWedding } from "@/actions/wedding"

interface RsvpToggleProps {
  weddingId: string
  initialEnabled: boolean
}

export function RsvpToggle({ weddingId, initialEnabled }: RsvpToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await updateWedding({ weddingId, rsvpEnabled: next })
      if (result.error) {
        setEnabled(!next)
        toast.error("Impossible de modifier le RSVP. Réessayez.")
      } else {
        toast.success(next ? "Formulaire RSVP activé" : "Formulaire RSVP désactivé")
      }
    })
  }

  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={enabled}
    >
      RSVP {enabled ? "activé" : "désactivé"}
    </Button>
  )
}

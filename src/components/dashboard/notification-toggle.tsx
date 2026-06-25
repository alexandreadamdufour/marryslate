"use client"

import { useState, useTransition } from "react"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import { updateWeddingNotifications } from "@/actions/notifications"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

export function NotificationToggle({ wedding }: Props) {
  const [enabled, setEnabled] = useState(wedding.notifications_enabled)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked
    setEnabled(next)
    startTransition(async () => {
      const result = await updateWeddingNotifications({ weddingId: wedding.id, enabled: next })
      if (result.error) {
        setEnabled(!next)
        toast.error("Erreur lors de la sauvegarde.")
      }
    })
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium leading-none">
          {enabled ? (
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          Notifications par email
        </div>
        <p className="text-xs text-muted-foreground">
          Recevez un email à chaque contribution, réponse RSVP ou message du livre d&apos;or.
        </p>
      </div>

      <label
        className="flex shrink-0 cursor-pointer items-center"
        aria-label={
          enabled ? "Désactiver les notifications email" : "Activer les notifications email"
        }
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={enabled}
          disabled={isPending}
          onChange={handleChange}
        />
        <div className="peer relative h-5 w-9 rounded-full bg-input transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-4 peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
      </label>
    </div>
  )
}

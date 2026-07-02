"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { toast } from "sonner"
import { CheckCircle2, Circle, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { completeOnboardingChecklist } from "@/actions/wedding"
import { APP_URL } from "@/lib/constants"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
  hasGuests: boolean
  hasGifts: boolean
}

export function OnboardingChecklist({ wedding, hasGuests, hasGifts }: Props) {
  const storageKey = `onboarding-shared-${wedding.id}`
  const [shared, setShared] = useState(false)
  const triggeredRef = useRef(false)

  useEffect(() => {
    setShared(localStorage.getItem(storageKey) === "1")
  }, [storageKey])

  const items = [
    { key: "hero", label: "Ajouter votre photo de couple", href: "/dashboard/site" as Route, done: !!wedding.cover_image_url },
    { key: "guests", label: "Ajouter vos premiers invités", href: "/dashboard/invites" as Route, done: hasGuests },
    { key: "gifts", label: "Créer votre premier cadeau", href: "/dashboard/liste" as Route, done: hasGifts },
    { key: "rsvp", label: "Activer le RSVP", href: "/dashboard/invites" as Route, done: wedding.rsvp_enabled },
    { key: "share", label: "Partager votre lien avec vos proches", done: shared },
  ]

  const completedCount = items.filter((i) => i.done).length

  useEffect(() => {
    if (completedCount === 5 && !triggeredRef.current) {
      triggeredRef.current = true
      completeOnboardingChecklist(wedding.id)
    }
  }, [completedCount, wedding.id])

  async function handleCopyLink() {
    const url = `${APP_URL}/m/${wedding.slug}`
    await navigator.clipboard.writeText(url)
    localStorage.setItem(storageKey, "1")
    setShared(true)
    toast.success("Lien copié.", { duration: 3000 })
  }

  if (completedCount === 5) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Démarrer votre mariage</CardTitle>
        <p className="text-sm text-muted-foreground">{completedCount}/5 étapes complétées</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
            <div className="flex items-center gap-2.5">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={item.done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                {item.label}
              </span>
            </div>
            {!item.done && (
              item.key === "share" ? (
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={handleCopyLink}>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copier le lien
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href={item.href!}>Aller</Link>
                </Button>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

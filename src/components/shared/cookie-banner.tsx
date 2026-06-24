"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "amora_cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Délai pour ne pas bloquer le LCP
    const timer = setTimeout(() => {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 px-4 py-4 shadow-lg backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border"
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Ce site utilise des cookies nécessaires à l&apos;authentification et aux paiements
        sécurisés.{" "}
        <Link
          href="/confidentialite"
          className="underline underline-offset-4 hover:text-foreground"
        >
          En savoir plus
        </Link>
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept} className="flex-1">
          Accepter
        </Button>
        <Button size="sm" variant="outline" onClick={decline} className="flex-1">
          Refuser
        </Button>
      </div>
    </div>
  )
}

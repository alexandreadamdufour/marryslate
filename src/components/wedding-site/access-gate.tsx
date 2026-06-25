"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  weddingSlug: string
  partner1: string
  partner2: string
}

export function AccessGate({ weddingSlug, partner1, partner2 }: Props) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/wedding-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: weddingSlug, code: trimmed }),
      })

      if (res.ok) {
        // Hard reload so the server component re-renders with the new cookie
        window.location.reload()
      } else {
        const data = (await res.json()) as { error?: string }
        setError(
          data.error === "INVALID_CODE"
            ? "Code incorrect. Vérifiez votre invitation."
            : "Une erreur est survenue, réessayez."
        )
        setLoading(false)
      }
    } catch {
      setError("Une erreur est survenue, réessayez.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl">
            {partner1} &amp; {partner2}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ce site est protégé par un code d&apos;accès.
            <br />
            Consultez votre invitation pour le retrouver.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="gate-code">Code d&apos;accès</Label>
            <Input
              id="gate-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AMOUR2026"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={8}
              className="text-center font-mono tracking-widest"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!code.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Vérification…
              </>
            ) : (
              "Accéder au site"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          Créé avec{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Amora
          </Link>
        </p>
      </div>
    </div>
  )
}

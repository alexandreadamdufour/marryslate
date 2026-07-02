"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateWeddingAccessCode } from "@/actions/access-code"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

const CODE_RE = /^[a-zA-Z0-9]*$/

export function AccessCodeForm({ wedding }: Props) {
  const [enabled, setEnabled] = useState(wedding.access_code_enabled)
  const [code, setCode] = useState(wedding.access_code ?? "")
  const [showCode, setShowCode] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleCodeChange(v: string) {
    if (CODE_RE.test(v)) setCode(v.toUpperCase())
  }

  async function handleSave() {
    if (enabled && (code.length < 4 || code.length > 8 || !CODE_RE.test(code))) {
      toast.error("Le code doit contenir 4 à 8 caractères (lettres et chiffres).")
      return
    }
    setSaving(true)
    const result = await updateWeddingAccessCode({
      weddingId: wedding.id,
      enabled,
      code: enabled ? code : undefined,
    })
    setSaving(false)
    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
    } else {
      toast.success(
        enabled ? "Accès par code activé." : "Protection désactivée.",
        { duration: 3000 }
      )
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">Accès par code</p>
          <p className="text-xs text-muted-foreground">
            Les invités devront saisir un code pour accéder au site.
          </p>
        </div>
        <label
          className="flex shrink-0 cursor-pointer items-center"
          aria-label={enabled ? "Désactiver le code d'accès" : "Activer le code d'accès"}
        >
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div className="peer relative h-5 w-9 rounded-full bg-input transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform hover:bg-input/80 peer-checked:bg-primary peer-checked:after:translate-x-4 peer-checked:hover:bg-primary/90 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
        </label>
      </div>

      {/* Code input — shown only when enabled */}
      {enabled && (
        <div className="space-y-1.5">
          <Label htmlFor="dashboard-access-code">Code d&apos;accès</Label>
          <div className="flex gap-2">
            <Input
              id="dashboard-access-code"
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="AMOUR26"
              maxLength={8}
              className="font-mono tracking-widest"
              aria-describedby="code-hint"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowCode((v) => !v)}
              aria-label={showCode ? "Masquer le code" : "Afficher le code"}
            >
              {showCode ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          <p id="code-hint" className="text-xs text-muted-foreground">
            4 à 8 caractères, lettres et chiffres uniquement. À communiquer dans vos invitations.
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </div>
  )
}

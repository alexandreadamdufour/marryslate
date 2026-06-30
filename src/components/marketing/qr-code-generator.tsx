"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import QRCode from "qrcode"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, QrCode } from "lucide-react"

export function QrCodeGenerator() {
  const [url, setUrl] = useState("")
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generate = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setDataUrl(null)
      return
    }
    try {
      const result = await QRCode.toDataURL(trimmed, {
        width: 480,
        margin: 2,
        color: { dark: "#0a0a0a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
      setDataUrl(result)
    } catch {
      setDataUrl(null)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => generate(url), 280)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [url, generate])

  const handleDownload = () => {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "qr-code-mariage.png"
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="qr-url-input" className="text-sm font-medium">
          URL de votre site mariage
        </Label>
        <Input
          id="qr-url-input"
          type="url"
          placeholder="marryslate.com/m/emma-et-leo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 text-base"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Collez l&apos;URL de votre site Marryslate ou n&apos;importe quelle autre adresse web.
        </p>
      </div>

      {/* QR preview */}
      <div
        aria-live="polite"
        aria-label="Aperçu du QR code"
        className="flex min-h-56 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 transition-colors"
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="QR code pointant vers votre site mariage"
            width={200}
            height={200}
            className="rounded-xl shadow-md"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground/50">
            <QrCode className="h-16 w-16" aria-hidden="true" />
            <p className="text-sm">Votre QR code apparaîtra ici</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleDownload}
          disabled={!dataUrl}
          size="lg"
          className="w-full sm:flex-1"
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Télécharger le QR code
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:flex-1">
          <Link href="/inscription">Créer mon site gratuitement</Link>
        </Button>
      </div>
    </div>
  )
}

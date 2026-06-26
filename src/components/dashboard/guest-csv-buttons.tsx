"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { exportGuestsCSV } from "@/actions/exports"
import { importGuests } from "@/actions/guests"
import { WEDDING_SIDES, RSVP_STATUSES } from "@/lib/validators/guest"
import type { CreateGuestInput } from "@/lib/validators/guest"

interface Props { weddingId: string }

function parseCsvRow(row: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]!
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function GuestCsvButtons({ weddingId }: Props) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleExport() {
    setExporting(true)
    const result = await exportGuestsCSV()
    setExporting(false)
    if (result.error ?? !result.data) { toast.error("Erreur export"); return }
    const blob = new Blob(["﻿" + result.data.csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.data.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setImporting(true)
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    // Skip header row (first line)
    const dataLines = lines.slice(1)

    if (dataLines.length === 0) {
      toast.error("Fichier vide ou sans données.")
      setImporting(false)
      return
    }

    const guests: Omit<CreateGuestInput, "weddingId">[] = dataLines.map((line) => {
      const [firstName, lastName, email, phone, , groupName, dietary, plusOneRaw, plusOneName, , rsvpRaw, notes] = parseCsvRow(line)
      const plusOne = plusOneRaw?.toLowerCase() === "oui"
      const rsvpStatus = (RSVP_STATUSES as readonly string[]).includes(rsvpRaw ?? "")
        ? (rsvpRaw as (typeof RSVP_STATUSES)[number])
        : "pending"
      return {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        groupName: groupName || undefined,
        side: "both" as (typeof WEDDING_SIDES)[number],
        dietary: dietary || undefined,
        plusOne,
        plusOneName: plusOneName || undefined,
        rsvpStatus,
        notes: notes || undefined,
      }
    })

    const result = await importGuests({ weddingId, guests })
    setImporting(false)

    if (result.error ?? !result.data) { toast.error("Erreur lors de l'import."); return }
    const count = result.data.count
    toast.success(`${count} invité${count !== 1 ? "s" : ""} importé${count !== 1 ? "s" : ""}`)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        {exporting ? "Export…" : "Exporter CSV"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
        <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
        {importing ? "Import…" : "Importer CSV"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Importer un fichier CSV"
        onChange={handleImport}
      />
    </div>
  )
}

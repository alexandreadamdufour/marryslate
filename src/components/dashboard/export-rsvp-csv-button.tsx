"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { exportRsvpCSV } from "@/actions/exports"
import { Button } from "@/components/ui/button"

interface Props { weddingId: string }

export function ExportRsvpCsvButton({ weddingId }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const result = await exportRsvpCSV(weddingId)
    setLoading(false)

    if ("error" in result) return

    const blob = new Blob(["﻿" + result.data.csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = result.data.filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      {loading ? "Export…" : "Exporter CSV"}
    </Button>
  )
}

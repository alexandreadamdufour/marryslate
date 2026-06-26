import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMyWedding } from "@/queries/wedding"
import { getGuestsByWedding } from "@/queries/guests"
import { getSeatingTables } from "@/queries/seating"
import { SeatingEditor } from "@/components/dashboard/seating-editor"

export const metadata: Metadata = { title: "Plan de table" }

export default async function SeatingPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const [tables, guests] = await Promise.all([
    getSeatingTables(wedding.id),
    getGuestsByWedding(wedding.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Plan de table</h1>
        <p className="text-sm text-muted-foreground">
          Glissez les invités depuis le panneau gauche pour les placer sur une table.
        </p>
      </div>
      <SeatingEditor initialTables={tables} guests={guests} weddingId={wedding.id} />
    </div>
  )
}

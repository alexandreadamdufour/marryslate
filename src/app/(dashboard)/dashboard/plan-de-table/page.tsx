import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Monitor } from "lucide-react"
import { getMyWedding } from "@/queries/wedding"
import { getGuestsByWedding } from "@/queries/guests"
import { getSeatingTables } from "@/queries/seating"
import { SeatingEditor } from "@/components/dashboard/seating-editor"
import { EmptyState } from "@/components/ui/empty-state"

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

      {/* Éditeur drag-and-drop à positions absolues — non utilisable sur petit écran */}
      <div className="block space-y-6 md:hidden">
        <EmptyState
          icon={Monitor}
          title="Optimisé pour ordinateur"
          description="Le plan de table utilise un éditeur interactif conçu pour un grand écran. Ouvrez cette page depuis un ordinateur pour l'utiliser confortablement."
        />
        {tables.length > 0 && (
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{table.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {table.assignedGuests.length}/{table.capacity}
                  </p>
                </div>
                {table.assignedGuests.length > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {table.assignedGuests
                      .map((g) => [g.firstName, g.lastName].filter(Boolean).join(" ") || "—")
                      .join(", ")}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Aucun invité placé.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <SeatingEditor initialTables={tables} guests={guests} weddingId={wedding.id} />
      </div>
    </div>
  )
}

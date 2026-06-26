import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMyWedding } from "@/queries/wedding"
import { getChecklistItems } from "@/queries/planner"
import { PlannerEditor } from "@/components/dashboard/planner-editor"

export const metadata: Metadata = { title: "Wedding Planner" }

export default async function PlannerPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const items = await getChecklistItems(wedding.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Wedding Planner</h1>
        <p className="text-sm text-muted-foreground">
          Suivez l'avancement de vos préparatifs, étape par étape.
        </p>
      </div>
      <PlannerEditor initialItems={items} weddingId={wedding.id} />
    </div>
  )
}

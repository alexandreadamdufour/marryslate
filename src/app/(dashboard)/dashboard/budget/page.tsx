import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMyWedding } from "@/queries/wedding"
import { getBudgetItems } from "@/queries/budget"
import { BudgetEditor } from "@/components/dashboard/budget-editor"

export const metadata: Metadata = { title: "Budget mariage" }

export default async function BudgetPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const items = await getBudgetItems(wedding.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Budget mariage</h1>
        <p className="text-sm text-muted-foreground">
          Suivez vos dépenses estimées et réelles pour chaque poste.
        </p>
      </div>
      <BudgetEditor initialItems={items} weddingId={wedding.id} />
    </div>
  )
}

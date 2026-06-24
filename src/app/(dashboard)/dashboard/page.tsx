import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { WeddingOverviewCard } from "@/components/dashboard/wedding-overview-card"

export const metadata: Metadata = { title: "Tableau de bord" }

export default async function DashboardPage() {
  const wedding = await getMyWedding()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">
          {wedding
            ? `${wedding.partner1_first_name} & ${wedding.partner2_first_name}`
            : "Tableau de bord"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue dans votre espace mariage.
        </p>
      </div>

      {wedding && <WeddingOverviewCard wedding={wedding} />}
    </div>
  )
}

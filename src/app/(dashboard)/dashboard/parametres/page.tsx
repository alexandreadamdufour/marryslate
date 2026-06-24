import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { WeddingSettingsForm } from "@/components/dashboard/wedding-settings-form"

export const metadata: Metadata = { title: "Paramètres" }

export default async function ParametresPage() {
  const wedding = await getMyWedding()

  if (!wedding) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez les informations de votre mariage.</p>
      </div>
      <WeddingSettingsForm wedding={wedding} />
    </div>
  )
}

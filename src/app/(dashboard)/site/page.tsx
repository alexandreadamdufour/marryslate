import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { WeddingSettingsForm } from "@/components/dashboard/wedding-settings-form"

export const metadata: Metadata = { title: "Mon site mariage" }

export default async function SitePage() {
  const wedding = await getMyWedding()

  if (!wedding) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Mon site mariage</h1>
        <p className="text-sm text-muted-foreground">Personnalisez votre site public.</p>
      </div>
      <WeddingSettingsForm wedding={wedding} />
    </div>
  )
}

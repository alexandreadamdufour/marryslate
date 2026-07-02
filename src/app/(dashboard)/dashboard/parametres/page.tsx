import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { WeddingSettingsForm } from "@/components/dashboard/wedding-settings-form"
import { NotificationToggle } from "@/components/dashboard/notification-toggle"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Paramètres" }

export default async function ParametresPage() {
  const wedding = await getMyWedding()

  if (!wedding) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez les informations de votre mariage.</p>
      </div>

      <WeddingSettingsForm wedding={wedding} />

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Préférences d&apos;envoi des emails automatiques.
          </p>
        </div>
        <div className="max-w-lg">
          <NotificationToggle wedding={wedding} />
        </div>
      </div>
    </div>
  )
}

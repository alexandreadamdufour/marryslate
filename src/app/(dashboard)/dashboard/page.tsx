import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { getGuestsByWedding } from "@/queries/guests"
import { getGiftsByWedding } from "@/queries/gifts"
import { WeddingOverviewCard } from "@/components/dashboard/wedding-overview-card"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"

export const metadata: Metadata = { title: "Tableau de bord" }

export default async function DashboardPage() {
  const wedding = await getMyWedding()
  const showChecklist = !!wedding && !wedding.onboarding_completed_at

  const [guests, gifts] = showChecklist
    ? await Promise.all([getGuestsByWedding(wedding.id), getGiftsByWedding(wedding.id)])
    : [[], []]

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

      {showChecklist && wedding && (
        <OnboardingChecklist wedding={wedding} hasGuests={guests.length > 0} hasGifts={gifts.length > 0} />
      )}

      {wedding && <WeddingOverviewCard wedding={wedding} />}
    </div>
  )
}

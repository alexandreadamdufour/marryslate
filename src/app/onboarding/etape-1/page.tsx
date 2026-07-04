import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Bienvenue" }

export default function OnboardingWelcomePage() {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <OnboardingStepIndicator currentStep={1} />
      <div className="space-y-4">
        <div className="text-6xl">💍</div>
        <h1 className="text-3xl">Bienvenue sur Marryslate</h1>
        <p className="text-muted-foreground">
          Créons ensemble votre site de mariage. Ça prend environ 2 minutes.
        </p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/onboarding/etape-2">Commencer</Link>
      </Button>
    </div>
  )
}

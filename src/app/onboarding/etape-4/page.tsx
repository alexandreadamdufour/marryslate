import type { Metadata } from "next"
import Link from "next/link"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"
import { OnboardingCompleteTracker } from "@/components/dashboard/onboarding-complete-tracker"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Votre site est prêt !" }

export default function OnboardingStep4Page() {
  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <OnboardingCompleteTracker />
      <OnboardingStepIndicator currentStep={4} />
      <div className="space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl">Votre site est prêt !</h1>
        <p className="text-muted-foreground">
          Commencez à personnaliser votre espace et partagez le lien avec vos invités.
        </p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/dashboard">Accéder à mon tableau de bord</Link>
      </Button>
    </div>
  )
}

import type { Metadata } from "next"
import { OnboardingThemeForm } from "@/components/dashboard/onboarding-theme-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 4" }

export default function OnboardingStep4ThemePage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={4} />
      <div className="space-y-2">
        <h1 className="text-3xl">Choisissez votre thème</h1>
        <p className="text-muted-foreground">
          Vous pourrez en changer plus tard depuis votre tableau de bord.
        </p>
      </div>
      <OnboardingThemeForm />
    </div>
  )
}

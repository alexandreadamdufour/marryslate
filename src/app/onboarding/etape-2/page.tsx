import type { Metadata } from "next"
import { OnboardingStep1Form } from "@/components/dashboard/onboarding-step1-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 2" }

export default function OnboardingStep1Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={2} />
      <div className="space-y-2">
        <h1 className="text-3xl">Qui sont les mariés ?</h1>
        <p className="text-muted-foreground">Ces prénoms apparaîtront sur votre site mariage.</p>
      </div>
      <OnboardingStep1Form />
    </div>
  )
}

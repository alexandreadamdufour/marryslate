import type { Metadata } from "next"
import { OnboardingStep2Form } from "@/components/dashboard/onboarding-step2-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 2" }

export default function OnboardingStep2Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={2} />
      <div className="space-y-2">
        <h1 className="text-3xl">Quelle est la date de votre mariage ?</h1>
        <p className="text-muted-foreground">Vous pourrez la modifier plus tard.</p>
      </div>
      <OnboardingStep2Form />
    </div>
  )
}

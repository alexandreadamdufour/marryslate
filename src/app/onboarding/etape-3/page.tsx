import type { Metadata } from "next"
import { OnboardingStep3Form } from "@/components/dashboard/onboarding-step3-form"
import { OnboardingStepIndicator } from "@/components/dashboard/onboarding-step-indicator"

export const metadata: Metadata = { title: "Onboarding — Étape 3" }

export default function OnboardingStep3Page() {
  return (
    <div className="w-full max-w-md space-y-8">
      <OnboardingStepIndicator currentStep={3} />
      <div className="space-y-2">
        <h1 className="text-3xl">Choisissez l&apos;adresse de votre site</h1>
        <p className="text-muted-foreground">
          Ce sera l&apos;URL que vous partagerez à vos invités.
        </p>
      </div>
      <OnboardingStep3Form />
    </div>
  )
}

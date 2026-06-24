import { cn } from "@/lib/utils"
import { ONBOARDING_STEPS } from "@/lib/constants"

interface OnboardingStepIndicatorProps {
  currentStep: number
}

export function OnboardingStepIndicator({ currentStep }: OnboardingStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemax={ONBOARDING_STEPS}>
      {Array.from({ length: ONBOARDING_STEPS }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
              step < currentStep && "bg-primary text-primary-foreground",
              step === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
              step > currentStep && "bg-muted text-muted-foreground"
            )}
          >
            {step < currentStep ? "✓" : step}
          </div>
          {step < ONBOARDING_STEPS && (
            <div className={cn("h-px w-8 bg-border", step < currentStep && "bg-primary")} />
          )}
        </div>
      ))}
    </div>
  )
}

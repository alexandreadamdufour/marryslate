import type { TimelineStep } from "@/queries/timeline"

interface WeddingTimelineSectionProps {
  steps: TimelineStep[]
}

export function WeddingTimelineSection({ steps }: WeddingTimelineSectionProps) {
  if (steps.length === 0) return null

  return (
    <section id="programme-journee" className="py-20">
      <div className="mx-auto max-w-xl px-6">
        <h2 className="mb-12 text-center text-3xl sm:text-4xl">Programme de la journée</h2>

        <div>
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-5">
              {/* Dot + vertical connector */}
              <div className="flex flex-col items-center">
                <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary ring-2 ring-background ring-offset-2" />
                {index < steps.length - 1 && (
                  <div className="my-2 w-px flex-1 bg-border" />
                )}
              </div>

              {/* Content */}
              <div className={index < steps.length - 1 ? "pb-10" : "pb-0"}>
                <div className="flex flex-wrap items-baseline gap-2">
                  {step.emoji && (
                    <span className="text-xl" aria-hidden="true">{step.emoji}</span>
                  )}
                  <span className="font-serif text-lg font-semibold text-primary">
                    {step.time}
                  </span>
                  <span className="font-serif text-xl">{step.title}</span>
                </div>
                {step.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

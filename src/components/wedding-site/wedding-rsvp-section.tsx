"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Check, X, Loader2, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { submitRsvp } from "@/actions/rsvp"
import { submitRsvpSchema, type SubmitRsvpInput } from "@/lib/validators/rsvp"

interface WeddingRsvpSectionProps {
  weddingId: string
  partner1: string
  partner2: string
}

type Step = "idle" | "form" | "done"

export function WeddingRsvpSection({ weddingId, partner1, partner2 }: WeddingRsvpSectionProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("idle")
  const [attending, setAttending] = useState<boolean | null>(null)

  const form = useForm<SubmitRsvpInput>({
    resolver: zodResolver(submitRsvpSchema),
    defaultValues: {
      weddingId,
      guestCount: 1,
      attending: true,
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const watchAttending = form.watch("attending")

  function openWith(att: boolean) {
    form.reset({ weddingId, attending: att, guestCount: 1 })
    setAttending(att)
    setStep("form")
    setOpen(true)
  }

  async function onSubmit(values: SubmitRsvpInput) {
    const result = await submitRsvp(values)
    if (result.error === "RATE_LIMITED") {
      toast.error("Trop de tentatives, réessayez dans une heure.")
      return
    }
    if (result.error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      return
    }
    setStep("done")
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setOpen(false)
      setTimeout(() => {
        setStep("idle")
        setAttending(null)
        form.reset()
      }, 300)
    }
  }

  return (
    <section id="rsvp" className="py-20">
      <div className="mx-auto max-w-lg px-6 text-center">
        <CalendarCheck className="mx-auto mb-4 h-8 w-8 text-primary opacity-70" aria-hidden="true" />
        <h2 className="mb-3 text-3xl sm:text-4xl">Confirmez votre présence</h2>
        <p className="mb-10 text-muted-foreground">
          Dites-nous si vous serez là pour célébrer avec {partner1} &amp; {partner2}.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => openWith(true)}>
            Je serai présent·e
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => openWith(false)}
          >
            Je ne pourrai pas venir
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {step === "done" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                {attending ? (
                  <Check className="h-7 w-7 text-primary" aria-hidden="true" />
                ) : (
                  <X className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {attending ? "À bientôt !" : "Réponse enregistrée"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {attending
                    ? `Votre présence est confirmée. On a hâte de vous retrouver pour célébrer ${partner1} & ${partner2} !`
                    : "Votre absence a bien été notée. Merci d'avoir pris le temps de répondre."}
                </DialogDescription>
              </DialogHeader>
              <Button className="mt-2" onClick={() => handleOpenChange(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {watchAttending ? "Je serai présent·e 🥂" : "Je ne pourrai pas venir"}
                </DialogTitle>
                <DialogDescription>
                  Complétez vos informations pour que {partner1} &amp; {partner2} puissent
                  vous retrouver sur la liste.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-2 space-y-4"
                noValidate
              >
                {/* Attending toggle */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => form.setValue("attending", true)}
                    className={[
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      watchAttending
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                    aria-pressed={watchAttending}
                  >
                    Présent·e
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue("attending", false)}
                    className={[
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      !watchAttending
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted",
                    ].join(" ")}
                    aria-pressed={!watchAttending}
                  >
                    Absent·e
                  </button>
                </div>

                {/* Prénom / Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rsvp-first-name">Prénom *</Label>
                    <Input
                      id="rsvp-first-name"
                      autoComplete="given-name"
                      {...form.register("firstName")}
                      aria-invalid={!!form.formState.errors.firstName}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-destructive" role="alert">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rsvp-last-name">Nom *</Label>
                    <Input
                      id="rsvp-last-name"
                      autoComplete="family-name"
                      {...form.register("lastName")}
                      aria-invalid={!!form.formState.errors.lastName}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-destructive" role="alert">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="rsvp-email">
                    Email *{" "}
                    <span className="text-muted-foreground text-xs">(pour recevoir la confirmation)</span>
                  </Label>
                  <Input
                    id="rsvp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    {...form.register("email")}
                    aria-invalid={!!form.formState.errors.email}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Champs conditionnels si présent */}
                {watchAttending && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="rsvp-guest-count">Nombre de personnes *</Label>
                      <Input
                        id="rsvp-guest-count"
                        type="number"
                        min={1}
                        max={20}
                        {...form.register("guestCount")}
                        aria-invalid={!!form.formState.errors.guestCount}
                      />
                      {form.formState.errors.guestCount && (
                        <p className="text-xs text-destructive" role="alert">
                          {form.formState.errors.guestCount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rsvp-dietary">
                        Régime alimentaire{" "}
                        <span className="text-muted-foreground text-xs">(optionnel)</span>
                      </Label>
                      <Input
                        id="rsvp-dietary"
                        placeholder="Végétarien, sans gluten, allergies…"
                        {...form.register("dietary")}
                      />
                    </div>
                  </>
                )}

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="rsvp-message">
                    Message{" "}
                    <span className="text-muted-foreground text-xs">(optionnel)</span>
                  </Label>
                  <textarea
                    id="rsvp-message"
                    rows={3}
                    placeholder={`Un petit mot pour ${partner1} & ${partner2}…`}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    {...form.register("message")}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Envoi en cours…
                    </>
                  ) : (
                    "Envoyer ma réponse"
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

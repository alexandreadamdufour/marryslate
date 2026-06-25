"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitGuestbookEntry } from "@/actions/guestbook"
import { submitGuestbookSchema, type SubmitGuestbookInput } from "@/lib/validators/guestbook"
import type { GuestbookMessage } from "@/queries/guestbook"

interface WeddingGuestbookSectionProps {
  weddingId: string
  partner1: string
  partner2: string
  initialMessages: GuestbookMessage[]
}

export function WeddingGuestbookSection({
  weddingId,
  partner1,
  partner2,
  initialMessages,
}: WeddingGuestbookSectionProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<SubmitGuestbookInput>({
    resolver: zodResolver(submitGuestbookSchema),
    defaultValues: { weddingId, authorName: "", message: "" },
  })

  async function onSubmit(values: SubmitGuestbookInput) {
    const result = await submitGuestbookEntry(values)
    if (result.error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      return
    }
    setMessages((prev) => [
      {
        id: result.data?.id ?? "",
        wedding_id: weddingId,
        author_name: values.authorName,
        message: values.message,
        is_visible: true,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])
    setSubmitted(true)
    form.reset({ weddingId, authorName: "", message: "" })
  }

  return (
    <section id="livre-d-or" className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-12 text-center">
          <Heart className="mx-auto mb-4 h-8 w-8 text-primary opacity-70" aria-hidden="true" />
          <h2 className="mb-3 text-3xl sm:text-4xl">Livre d&apos;or</h2>
          <p className="text-muted-foreground">
            Laissez un message à {partner1} &amp; {partner2}.
          </p>
        </div>

        {submitted ? (
          <div className="mb-12 rounded-xl border bg-card p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="font-medium">Merci pour votre message !</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {partner1} &amp; {partner2} le liront avec beaucoup d&apos;émotion.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              Laisser un autre message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mb-12 space-y-4 rounded-xl border bg-card p-6"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="gb-author">Votre prénom *</Label>
              <Input
                id="gb-author"
                autoComplete="given-name"
                placeholder="Marie"
                {...form.register("authorName")}
                aria-invalid={!!form.formState.errors.authorName}
              />
              {form.formState.errors.authorName && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.authorName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gb-message">Votre message *</Label>
              <Textarea
                id="gb-message"
                rows={4}
                placeholder={`Un petit mot pour ${partner1} & ${partner2}…`}
                maxLength={2000}
                {...form.register("message")}
                aria-invalid={!!form.formState.errors.message}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Envoi…
                </>
              ) : (
                "Laisser un message"
              )}
            </Button>
          </form>
        )}

        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((m) => (
              <GuestbookCard key={m.id} message={m} />
            ))}
          </div>
        )}

        {messages.length === 0 && !submitted && (
          <p className="text-center text-sm text-muted-foreground">
            Soyez le·la premier·e à laisser un message.
          </p>
        )}
      </div>
    </section>
  )
}

function GuestbookCard({ message }: { message: GuestbookMessage }) {
  const initial = message.author_name[0]?.toUpperCase() ?? "?"
  const date = new Date(message.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium">{message.author_name}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{message.message}</p>
        </div>
      </div>
    </div>
  )
}

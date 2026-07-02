"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createTimelineStepSchema, type CreateTimelineStepInput } from "@/lib/validators/timeline"
import { createTimelineStep, updateTimelineStep } from "@/actions/timeline"
import type { TimelineStep } from "@/queries/timeline"

interface TimelineStepFormProps {
  weddingId: string
  step?: TimelineStep
  onSuccess: () => void
}

export function TimelineStepForm({ weddingId, step, onSuccess }: TimelineStepFormProps) {
  const form = useForm<CreateTimelineStepInput>({
    resolver: zodResolver(createTimelineStepSchema),
    defaultValues: {
      weddingId,
      time: step?.time ?? "",
      title: step?.title ?? "",
      description: step?.description ?? "",
      emoji: step?.emoji ?? "",
    },
  })

  async function onSubmit(values: CreateTimelineStepInput) {
    const result = step
      ? await updateTimelineStep({ stepId: step.id, ...values })
      : await createTimelineStep(values)

    if (result.error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      return
    }
    toast.success(step ? "Étape modifiée" : "Étape ajoutée", { duration: 3000 })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure *</FormLabel>
                <FormControl>
                  <Input placeholder="15h00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emoji</FormLabel>
                <FormControl>
                  <Input placeholder="💍" className="text-center text-lg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre *</FormLabel>
              <FormControl>
                <Input placeholder="Cérémonie civile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description{" "}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informations complémentaires…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : step ? (
            "Modifier l'étape"
          ) : (
            "Ajouter l'étape"
          )}
        </Button>
      </form>
    </Form>
  )
}

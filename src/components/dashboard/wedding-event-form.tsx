"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { createWeddingEventSchema } from "@/lib/validators/events"
import { createWeddingEvent, updateWeddingEvent } from "@/actions/events"
import type { WeddingEvent } from "@/queries/events"

type FormValues = z.infer<typeof createWeddingEventSchema>

// datetime-local inputs produce "YYYY-MM-DDTHH:mm"; ISO strings from DB start with same prefix
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 16)
}

interface Props {
  weddingId: string
  event?: WeddingEvent
  onSuccess: () => void
}

export function WeddingEventForm({ weddingId, event, onSuccess }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(createWeddingEventSchema),
    defaultValues: {
      weddingId,
      title:           event?.title ?? "",
      startAt:         toDatetimeLocal(event?.start_at),
      endAt:           toDatetimeLocal(event?.end_at),
      locationName:    event?.location_name ?? "",
      locationAddress: event?.location_address ?? "",
      dressCode:       event?.dress_code ?? "",
      description:     event?.description ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    const result = event
      ? await updateWeddingEvent({ eventId: event.id, ...values })
      : await createWeddingEvent(values)

    if (result.error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      return
    }
    toast.success(event ? "Événement modifié" : "Événement ajouté", { duration: 3000 })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Début <span className="text-xs text-muted-foreground">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fin <span className="text-xs text-muted-foreground">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="locationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Lieu <span className="text-xs text-muted-foreground">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Mairie de Paris" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dressCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tenue <span className="text-xs text-muted-foreground">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Tenue de soirée" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Adresse <span className="text-xs text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="5 rue de Rivoli, 75001 Paris" {...field} value={field.value ?? ""} />
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
                Description <span className="text-xs text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informations complémentaires pour vos invités…"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
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
          ) : event ? (
            "Modifier l'événement"
          ) : (
            "Ajouter l'événement"
          )}
        </Button>
      </form>
    </Form>
  )
}

"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2, Loader2 } from "lucide-react"
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
import {
  updatePracticalInfoSchema,
  type UpdatePracticalInfoInput,
  type PracticalInfo,
} from "@/lib/validators/practical-info"
import { updatePracticalInfo } from "@/actions/practical-info"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

function VenueFields({
  control,
  prefix,
}: {
  control: ReturnType<typeof useForm<UpdatePracticalInfoInput>>["control"]
  prefix: "venue_ceremony" | "venue_reception"
}) {
  return (
    <div className="space-y-3">
      <FormField
        control={control}
        name={`${prefix}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du lieu</FormLabel>
            <FormControl>
              <Input placeholder="Mairie de Paris, Château de Versailles…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.address`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Adresse</FormLabel>
            <FormControl>
              <Input placeholder="5 Place du Général de Gaulle, 75004 Paris" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.maps_url`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lien Google Maps</FormLabel>
            <FormControl>
              <Input placeholder="https://maps.google.com/…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function PracticalInfoForm({ wedding }: Props) {
  const existing = wedding.practical_info as PracticalInfo | null

  const emptyVenue = { name: "", address: "", maps_url: "" }

  const form = useForm<UpdatePracticalInfoInput>({
    resolver: zodResolver(updatePracticalInfoSchema),
    defaultValues: {
      weddingId: wedding.id,
      venue_ceremony: existing?.venue_ceremony
        ? { name: existing.venue_ceremony.name ?? "", address: existing.venue_ceremony.address ?? "", maps_url: existing.venue_ceremony.maps_url ?? "" }
        : emptyVenue,
      venue_reception: existing?.venue_reception
        ? { name: existing.venue_reception.name ?? "", address: existing.venue_reception.address ?? "", maps_url: existing.venue_reception.maps_url ?? "" }
        : emptyVenue,
      dress_code: existing?.dress_code ?? "",
      accommodations: existing?.accommodations?.map((a) => ({
        name: a.name ?? "",
        address: a.address ?? "",
        booking_url: a.booking_url ?? "",
        price_range: a.price_range ?? "",
      })) ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "accommodations",
  })

  async function onSubmit(values: UpdatePracticalInfoInput) {
    const result = await updatePracticalInfo(values)
    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
      return
    }
    toast.success("Infos pratiques enregistrées")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-8">
        {/* Cérémonie */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Lieu de la cérémonie</p>
          <VenueFields control={form.control} prefix="venue_ceremony" />
        </div>

        {/* Réception */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Lieu de la réception</p>
          <VenueFields control={form.control} prefix="venue_reception" />
        </div>

        {/* Dress code */}
        <FormField
          control={form.control}
          name="dress_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Dress code{" "}
                <span className="text-xs text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tenue de soirée — couleurs pastels bienvenues…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hébergements */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            Hébergements recommandés{" "}
            <span className="text-xs font-normal text-muted-foreground">(5 max)</span>
          </p>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun hébergement ajouté.</p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Hébergement {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`accommodations.${index}.name`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Hôtel Le Manoir" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`accommodations.${index}.address`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="12 rue de la Paix, 75001 Paris" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`accommodations.${index}.price_range`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Fourchette de prix</FormLabel>
                      <FormControl>
                        <Input placeholder="80–120 €/nuit" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`accommodations.${index}.booking_url`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Lien de réservation</FormLabel>
                      <FormControl>
                        <Input placeholder="https://booking.com/…" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}

          {fields.length < 5 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => append({ name: "", address: "", booking_url: "", price_range: "" })}
            >
              <Plus className="h-4 w-4" />
              Ajouter un hébergement
            </Button>
          )}
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </Form>
  )
}

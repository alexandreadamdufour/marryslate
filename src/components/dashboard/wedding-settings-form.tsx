"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateWedding, checkSlugAvailability } from "@/actions/wedding"
import { updateWeddingSchema, type UpdateWeddingInput } from "@/lib/validators/wedding"
import { slugify } from "@/lib/utils"
import { useSitePreview } from "./site-preview-context"
import type { Tables } from "@/lib/supabase/types"

interface WeddingSettingsFormProps {
  wedding: Tables<"weddings">
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "unchanged"

export function WeddingSettingsForm({ wedding }: WeddingSettingsFormProps) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("unchanged")
  const [isSaving, setIsSaving] = useState(false)
  const { updatePreview } = useSitePreview()

  const form = useForm<UpdateWeddingInput>({
    resolver: zodResolver(updateWeddingSchema),
    defaultValues: {
      weddingId: wedding.id,
      partner1FirstName: wedding.partner1_first_name,
      partner2FirstName: wedding.partner2_first_name,
      weddingDate: wedding.wedding_date ?? "",
      slug: wedding.slug,
      isPublished: wedding.is_published,
    },
  })

  const partner1Watch = form.watch("partner1FirstName")
  const partner2Watch = form.watch("partner2FirstName")
  const dateWatch = form.watch("weddingDate")

  useEffect(() => {
    updatePreview({
      partner1: partner1Watch ?? "",
      partner2: partner2Watch ?? "",
      date: dateWatch ?? "",
    })
  }, [partner1Watch, partner2Watch, dateWatch, updatePreview])

  const checkSlug = useCallback(
    async (value: string) => {
      const trimmed = value.trim()
      if (trimmed === wedding.slug) { setSlugStatus("unchanged"); return }
      if (!trimmed || trimmed.length < 3) { setSlugStatus("idle"); return }
      setSlugStatus("checking")
      const { available } = await checkSlugAvailability(trimmed, wedding.id)
      setSlugStatus(available ? "available" : "taken")
    },
    [wedding.id, wedding.slug]
  )

  async function onSubmit(values: UpdateWeddingInput) {
    if (slugStatus === "taken") return
    setIsSaving(true)

    const result = await updateWedding(values)

    if (result.error) {
      if (result.error === "SLUG_TAKEN") {
        setSlugStatus("taken")
        form.setError("slug", { message: "Cette adresse est déjà prise" })
      } else {
        toast.error("Erreur lors de la sauvegarde.")
      }
      setIsSaving(false)
      return
    }

    toast.success("Modifications enregistrées")
    setSlugStatus("unchanged")
    setIsSaving(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        {/* Prénoms */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="partner1FirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom marié·e 1</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="partner2FirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom marié·e 2</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date */}
        <FormField
          control={form.control}
          name="weddingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date du mariage</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse du site</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    marryslate.com/m/
                  </span>
                  <Input
                    className="pl-[7.5rem]"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = slugify(e.target.value)
                      field.onChange(v)
                      checkSlug(v)
                    }}
                  />
                  {slugStatus === "checking" && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {slugStatus === "available" && (
                    <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                  )}
                  {slugStatus === "taken" && (
                    <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {slugStatus === "available" && <span className="text-green-600">Disponible !</span>}
                {slugStatus === "taken" && <span className="text-destructive">Adresse déjà prise.</span>}
                {(slugStatus === "idle" || slugStatus === "unchanged") && "Modifiez l'URL publique de votre site."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Publication */}
        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-lg border border-border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <div>
                <FormLabel className="text-base">Publier le site</FormLabel>
                <FormDescription>
                  Rend votre site accessible à vos invités via l&apos;URL marryslate.com/m/{form.watch("slug")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSaving || slugStatus === "taken" || slugStatus === "checking"}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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

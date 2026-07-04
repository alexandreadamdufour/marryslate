"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createWedding, checkSlugAvailability } from "@/actions/wedding"
import { slugify } from "@/lib/utils"
import { slugSchema } from "@/lib/validators/wedding"

const step3Schema = z.object({
  slug: slugSchema,
})

type Step3Values = z.infer<typeof step3Schema>

type SlugStatus = "idle" | "checking" | "available" | "taken"

export function OnboardingStep3Form() {
  const router = useRouter()
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { slug: "" },
  })

  const checkSlug = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed.length < 3) {
      setSlugStatus("idle")
      return
    }
    setSlugStatus("checking")
    const { available } = await checkSlugAvailability(trimmed)
    setSlugStatus(available ? "available" : "taken")
  }, [])

  async function onSubmit(values: Step3Values) {
    if (slugStatus === "taken") return
    setIsSubmitting(true)

    const stored = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    const result = await createWedding({
      partner1FirstName: stored.partner1FirstName ?? "",
      partner2FirstName: stored.partner2FirstName ?? "",
      weddingDate: stored.weddingDate || undefined,
      themeId: stored.themeId || undefined,
      slug: values.slug,
    })

    if (result.error) {
      if (result.error === "SLUG_TAKEN") {
        setSlugStatus("taken")
        form.setError("slug", { message: "Cette adresse est déjà prise" })
      } else {
        toast.error("Une erreur est survenue. Veuillez réessayer.")
      }
      setIsSubmitting(false)
      return
    }

    sessionStorage.removeItem("onboarding")
    router.push("/onboarding/etape-6")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse personnalisée</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    marryslate.com/m/
                  </span>
                  <Input
                    className="pl-[7.5rem]"
                    placeholder="sophie-et-thomas"
                    autoFocus
                    {...field}
                    onChange={(e) => {
                      const slugified = slugify(e.target.value)
                      field.onChange(slugified)
                      checkSlug(slugified)
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
                {slugStatus === "taken" && (
                  <span className="text-destructive">Cette adresse est déjà prise.</span>
                )}
                {slugStatus === "idle" &&
                  "Lettres minuscules, chiffres et tirets. Min. 3 caractères."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Retour
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || slugStatus === "taken" || slugStatus === "checking"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création…
              </>
            ) : (
              "Créer mon site"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

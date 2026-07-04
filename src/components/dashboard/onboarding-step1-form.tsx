"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const step1Schema = z.object({
  partner1FirstName: z.string().min(1, "Requis").max(50),
  partner2FirstName: z.string().min(1, "Requis").max(50),
})

type Step1Values = z.infer<typeof step1Schema>

export function OnboardingStep1Form() {
  const router = useRouter()
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { partner1FirstName: "", partner2FirstName: "" },
  })

  function onSubmit(values: Step1Values) {
    // Persister en sessionStorage pour consolidation à l'étape 3
    sessionStorage.setItem("onboarding", JSON.stringify(values))
    router.push("/onboarding/etape-3")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="partner1FirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom du/de la marié·e 1</FormLabel>
              <FormControl>
                <Input placeholder="ex. Sophie" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partner2FirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom du/de la marié·e 2</FormLabel>
              <FormControl>
                <Input placeholder="ex. Thomas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg">
          Suivant
        </Button>
      </form>
    </Form>
  )
}

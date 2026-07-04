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

const step2Schema = z.object({
  weddingDate: z.string().optional(),
})

type Step2Values = z.infer<typeof step2Schema>

export function OnboardingStep2Form() {
  const router = useRouter()
  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { weddingDate: "" },
  })

  function onSubmit(values: Step2Values) {
    const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
    sessionStorage.setItem("onboarding", JSON.stringify({ ...existing, ...values }))
    router.push("/onboarding/etape-4")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="weddingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date du mariage</FormLabel>
              <FormControl>
                <Input type="date" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Retour
          </Button>
          <Button type="submit" className="flex-1">
            Suivant
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => {
            const existing = JSON.parse(sessionStorage.getItem("onboarding") ?? "{}")
            sessionStorage.setItem(
              "onboarding",
              JSON.stringify({ ...existing, weddingDate: undefined })
            )
            router.push("/onboarding/etape-4")
          }}
        >
          Je ne sais pas encore
        </Button>
      </form>
    </Form>
  )
}

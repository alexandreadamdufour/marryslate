"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLANNER_CATEGORIES, PRIORITY_LABELS } from "@/lib/validators/planner"
import type { ChecklistItem } from "@/queries/planner"

const formSchema = z.object({
  category: z.string().min(1, "Requis"),
  title: z.string().min(1, "Requis").max(200),
  description: z.string().max(1000).optional(),
  due_date: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
})

type FormValues = z.infer<typeof formSchema>

interface AddProps {
  mode: "add"
  defaultCategory?: string
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
}

interface EditProps {
  mode: "edit"
  item: ChecklistItem
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
}

type Props = AddProps | EditProps

export function PlannerItemForm(props: Props) {
  const isEdit = props.mode === "edit"
  const item = isEdit ? (props as EditProps).item : null

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: item?.category ?? (props as AddProps).defaultCategory ?? PLANNER_CATEGORIES[0],
      title: item?.title ?? "",
      description: item?.description ?? "",
      due_date: item?.due_date ?? "",
      priority: (item?.priority as "high" | "medium" | "low") ?? "medium",
    },
  })

  async function onSubmit(values: FormValues) {
    await props.onSubmit(values)
    if (!isEdit) form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PLANNER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Priorité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["high", "medium", "low"] as const).map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <FormLabel className="text-xs">Tâche</FormLabel>
              <FormControl>
                <Input className="h-8 text-xs" placeholder="Ex : Réserver le lieu de réception" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Échéance (optionnel)</FormLabel>
                <FormControl>
                  <Input type="date" className="h-8 text-xs" {...field} value={field.value ?? ""} />
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
                <FormLabel className="text-xs">Note (optionnel)</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[32px] resize-none text-xs"
                    rows={1}
                    placeholder="Détails, liens..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={props.onCancel}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

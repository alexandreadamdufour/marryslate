"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  BUDGET_CATEGORIES,
  createBudgetItemSchema,
  updateBudgetItemSchema,
} from "@/lib/validators/budget"
import { createBudgetItem, updateBudgetItem } from "@/actions/budget"
import type { BudgetItem } from "@/queries/budget"

interface AddProps {
  mode: "add"
  weddingId: string
  onDone: () => void
}
interface EditProps {
  mode: "edit"
  item: BudgetItem
  onDone: () => void
}
type Props = AddProps | EditProps

const formSchema = z.object({
  category: z.string().min(1, "Requis"),
  name: z.string().min(1, "Requis").max(120),
  estimatedAmount: z.coerce.number().min(0).max(500_000),
  actualAmount: z.coerce.number().min(0).max(500_000).nullable().optional(),
  paidAmount: z.coerce.number().min(0).max(500_000).optional(),
  vendor: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
})
type FormValues = z.infer<typeof formSchema>

export function BudgetItemForm(props: Props) {
  const router = useRouter()
  const isEdit = props.mode === "edit"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEdit
        ? {
            category: props.item.category,
            name: props.item.name,
            estimatedAmount: Number(props.item.estimated_amount),
            actualAmount:
              props.item.actual_amount !== null ? Number(props.item.actual_amount) : undefined,
            paidAmount: Number(props.item.paid_amount),
            vendor: props.item.vendor ?? "",
            notes: props.item.notes ?? "",
          }
        : {
            category: "",
            name: "",
            estimatedAmount: 0,
            actualAmount: undefined,
            paidAmount: 0,
            vendor: "",
            notes: "",
          },
  })

  async function onSubmit(values: FormValues) {
    let result: { error?: string; data?: unknown }

    if (isEdit) {
      const parsed = updateBudgetItemSchema.safeParse({ itemId: props.item.id, ...values })
      if (!parsed.success) { toast.error("Données invalides"); return }
      result = await updateBudgetItem(parsed.data)
    } else {
      const parsed = createBudgetItemSchema.safeParse({
        weddingId: (props as AddProps).weddingId,
        ...values,
      })
      if (!parsed.success) { toast.error("Données invalides"); return }
      result = await createBudgetItem(parsed.data)
    }

    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
      return
    }

    toast.success(isEdit ? "Poste mis à jour" : "Poste ajouté", { duration: 3000 })
    router.refresh()
    props.onDone()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du poste</FormLabel>
                <FormControl>
                  <Input placeholder="Ex : Domaine de la Roseraie" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="estimatedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimé (€)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actualAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Réel (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="—"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payé (€)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prestataire</FormLabel>
                <FormControl>
                  <Input placeholder="Nom du prestataire" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input placeholder="Notes libres…" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Enregistrement…
              </>
            ) : isEdit ? (
              "Mettre à jour"
            ) : (
              "Ajouter"
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={props.onDone}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  )
}

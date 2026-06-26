"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { TABLE_SHAPES, TABLE_SHAPE_LABELS } from "@/lib/validators/seating"
import { createSeatingTable } from "@/actions/seating"

interface Props {
  weddingId: string
  defaultPosition: { x: number; y: number }
  onCreated: () => void
}

const schema = z.object({
  name: z.string().min(1, "Requis").max(50),
  capacity: z.coerce.number().int().min(1).max(50),
  shape: z.enum(TABLE_SHAPES),
})
type FormValues = z.infer<typeof schema>

export function SeatingAddTableDialog({ weddingId, defaultPosition, onCreated }: Props) {
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", capacity: 8, shape: "round" },
  })

  async function onSubmit(values: FormValues) {
    const result = await createSeatingTable({
      weddingId,
      name: values.name,
      capacity: values.capacity,
      shape: values.shape,
      positionX: defaultPosition.x,
      positionY: defaultPosition.y,
    })

    if (result.error) { toast.error(`Erreur: ${result.error}`); return }

    toast.success("Table créée")
    form.reset()
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter une table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle table</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input placeholder="Table 1, Famille…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="capacity" render={({ field }) => (
              <FormItem>
                <FormLabel>Capacité</FormLabel>
                <FormControl><Input type="number" min="1" max="50" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="shape" render={({ field }) => (
              <FormItem>
                <FormLabel>Forme</FormLabel>
                <div className="flex gap-2">
                  {TABLE_SHAPES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => field.onChange(s)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm transition-colors ${
                        field.value === s
                          ? "border-primary bg-primary/5 font-medium text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {TABLE_SHAPE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</>
                : "Créer la table"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

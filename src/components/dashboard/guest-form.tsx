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
  WEDDING_SIDES,
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
  SIDE_LABELS,
  createGuestSchema,
  updateGuestSchema,
} from "@/lib/validators/guest"
import { createGuest, updateGuest } from "@/actions/guests"
import type { Guest } from "@/queries/guests"

interface AddProps { mode: "add"; weddingId: string; onDone: () => void }
interface EditProps { mode: "edit"; guest: Guest; onDone: () => void }
type Props = AddProps | EditProps

const schema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
  groupName: z.string().max(80).optional(),
  side: z.enum(WEDDING_SIDES),
  dietary: z.string().max(300).optional(),
  plusOne: z.boolean(),
  plusOneName: z.string().max(100).optional(),
  invitationSent: z.boolean(),
  rsvpStatus: z.enum(RSVP_STATUSES),
  notes: z.string().max(500).optional(),
})
type FormValues = z.infer<typeof schema>

export function GuestForm(props: Props) {
  const router = useRouter()
  const isEdit = props.mode === "edit"
  const g = isEdit ? props.guest : null

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: g?.first_name ?? "",
      lastName: g?.last_name ?? "",
      email: g?.email ?? "",
      phone: g?.phone ?? "",
      groupName: g?.group_name ?? "",
      side: (g?.side as (typeof WEDDING_SIDES)[number]) ?? "both",
      dietary: g?.dietary ?? "",
      plusOne: g?.plus_one ?? false,
      plusOneName: g?.plus_one_name ?? "",
      invitationSent: g?.invitation_sent ?? false,
      rsvpStatus: (g?.rsvp_status as (typeof RSVP_STATUSES)[number]) ?? "pending",
      notes: g?.notes ?? "",
    },
  })

  const plusOne = form.watch("plusOne")

  async function onSubmit(values: FormValues) {
    let result: { error?: string }

    if (isEdit) {
      const parsed = updateGuestSchema.safeParse({ guestId: g!.id, ...values })
      if (!parsed.success) { toast.error("Données invalides"); return }
      result = await updateGuest(parsed.data)
    } else {
      const parsed = createGuestSchema.safeParse({
        weddingId: (props as AddProps).weddingId,
        ...values,
      })
      if (!parsed.success) { toast.error("Données invalides"); return }
      result = await createGuest(parsed.data)
    }

    if (result.error) { toast.error(result.error); return }

    toast.success(isEdit ? "Invité mis à jour" : "Invité ajouté")
    router.refresh()
    props.onDone()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl><Input placeholder="Marie" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl><Input placeholder="Dupont" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="marie@email.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl><Input placeholder="+33 6 …" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="side" render={({ field }) => (
            <FormItem>
              <FormLabel>Côté</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {WEDDING_SIDES.map((s) => (
                    <SelectItem key={s} value={s}>{SIDE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="groupName" render={({ field }) => (
            <FormItem>
              <FormLabel>Groupe</FormLabel>
              <FormControl><Input placeholder="Famille, Amis…" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rsvpStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut RSVP</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {RSVP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{RSVP_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="dietary" render={({ field }) => (
            <FormItem>
              <FormLabel>Régime alimentaire</FormLabel>
              <FormControl><Input placeholder="Végétarien, sans gluten…" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Input placeholder="Notes libres…" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex flex-wrap gap-6">
          <FormField control={form.control} name="plusOne" render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel className="mb-0">Plus one</FormLabel>
            </FormItem>
          )} />
          <FormField control={form.control} name="invitationSent" render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel className="mb-0">Invitation envoyée</FormLabel>
            </FormItem>
          )} />
        </div>

        {plusOne && (
          <FormField control={form.control} name="plusOneName" render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom du plus one</FormLabel>
              <FormControl><Input placeholder="Prénom" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Enregistrement…</>
            ) : isEdit ? "Mettre à jour" : "Ajouter"}
          </Button>
          <Button type="button" variant="ghost" onClick={props.onDone}>Annuler</Button>
        </div>
      </form>
    </Form>
  )
}

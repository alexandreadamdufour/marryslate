"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, MailCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  WEDDING_SIDES,
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
  SIDE_LABELS,
} from "@/lib/validators/guest"
import { deleteGuest } from "@/actions/guests"
import { GuestForm } from "./guest-form"
import { GuestCsvButtons } from "./guest-csv-buttons"
import type { Guest } from "@/queries/guests"

interface Props {
  initialGuests: Guest[]
  weddingId: string
}

const STATUS_BADGE: Record<string, string> = {
  accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  maybe: "bg-blue-100 text-blue-800 border-blue-200",
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-5 transition-colors hover:bg-muted/50", accent && "border-primary/30 bg-primary/5")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </p>
    </div>
  )
}

export function GuestEditor({ initialGuests, weddingId }: Props) {
  const [guests, setGuests] = useState(initialGuests)
  const [addOpen, setAddOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterSide, setFilterSide] = useState<string>("all")
  const [filterGroup, setFilterGroup] = useState("")
  const router = useRouter()

  useEffect(() => { setGuests(initialGuests) }, [initialGuests])

  const groups = useMemo(() => {
    const seen = new Set<string>()
    guests.forEach((g) => { if (g.group_name) seen.add(g.group_name) })
    return [...seen].sort()
  }, [guests])

  const filtered = useMemo(() => guests.filter((g) => {
    if (filterStatus !== "all" && g.rsvp_status !== filterStatus) return false
    if (filterSide !== "all" && g.side !== filterSide) return false
    if (filterGroup && g.group_name !== filterGroup) return false
    return true
  }), [guests, filterStatus, filterSide, filterGroup])

  const total = guests.length
  const confirmed = guests.filter((g) => g.rsvp_status === "accepted").length
  const declined = guests.filter((g) => g.rsvp_status === "declined").length
  const pending = guests.filter((g) => g.rsvp_status === "pending" || g.rsvp_status === "maybe").length

  async function handleDelete(guestId: string) {
    const result = await deleteGuest(guestId)
    if (result.error) { toast.error("Erreur lors de la suppression."); return }
    toast.success("Invité supprimé", { duration: 3000 })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Total invités" value={total} />
        <SummaryCard label="Acceptés" value={confirmed} accent />
        <SummaryCard label="Déclinés" value={declined} />
        <SummaryCard label="En attente" value={pending} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {RSVP_STATUSES.map((s) => <SelectItem key={s} value={s}>{RSVP_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSide} onValueChange={setFilterSide}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Côté" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les côtés</SelectItem>
            {WEDDING_SIDES.map((s) => <SelectItem key={s} value={s}>{SIDE_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        {groups.length > 0 && (
          <Select value={filterGroup || "all"} onValueChange={(v) => setFilterGroup(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Groupe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les groupes</SelectItem>
              {groups.map((gr) => <SelectItem key={gr} value={gr}>{gr}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {(filterStatus !== "all" || filterSide !== "all" || filterGroup) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus("all"); setFilterSide("all"); setFilterGroup("") }}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Guest list — colonnes compactées (Nom/Statut/Actions) sur mobile, complètes à partir de md */}
      {filtered.length > 0 && (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Côté</TableHead>
                <TableHead className="hidden md:table-cell">Groupe</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Régime</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{[guest.first_name, guest.last_name].filter(Boolean).join(" ") || "—"}</span>
                      {guest.invitation_sent && (
                        <MailCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Invitation envoyée" />
                      )}
                      {guest.plus_one && (
                        <Badge variant="outline" className="text-[11px]">+1{guest.plus_one_name ? ` ${guest.plus_one_name}` : ""}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {SIDE_LABELS[guest.side as keyof typeof SIDE_LABELS]}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {guest.group_name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {guest.email ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {guest.dietary ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border text-[11px]", STATUS_BADGE[guest.rsvp_status] ?? STATUS_BADGE.pending)}>
                      {RSVP_STATUS_LABELS[guest.rsvp_status as keyof typeof RSVP_STATUS_LABELS]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Modifier ${guest.first_name ?? ""}`}
                        onClick={() => { setEditingGuest(guest); setAddOpen(false) }}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        aria-label={`Supprimer ${guest.first_name ?? ""}`} onClick={() => handleDelete(guest.id)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length === 0 && !addOpen && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {guests.length === 0 ? "Aucun invité pour l'instant." : "Aucun invité pour ces filtres."}
          </p>
        </div>
      )}

      {/* Edit form */}
      {editingGuest && (
        <div className="rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Modifier l&apos;invité</h3>
          <GuestForm mode="edit" guest={editingGuest} onDone={() => setEditingGuest(null)} />
        </div>
      )}

      {/* Add form */}
      {addOpen && !editingGuest && (
        <div className="rounded-xl border p-5">
          <h3 className="mb-4 text-sm font-semibold">Nouvel invité</h3>
          <GuestForm mode="add" weddingId={weddingId} onDone={() => setAddOpen(false)} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!addOpen && !editingGuest && (
          <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un invité
          </Button>
        )}
        <GuestCsvButtons weddingId={weddingId} />
      </div>
    </div>
  )
}

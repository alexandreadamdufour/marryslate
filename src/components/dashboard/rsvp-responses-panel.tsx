"use client"

import { Fragment, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Check, X as XIcon, UserPlus, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  linkRsvpResponseToGuest,
  createGuestFromRsvpResponse,
  rejectRsvpResponse,
} from "@/actions/rsvp"
import type { Guest } from "@/queries/guests"
import type { RsvpResponse, RsvpResponsesByStatus } from "@/queries/rsvp"

interface Props {
  weddingId: string
  guests: Guest[]
  data: RsvpResponsesByStatus
}

const RESPONSE_STATUS_BADGE: Record<string, string> = {
  matched: "bg-green-100 text-green-800 border-green-200",
  pending_validation: "bg-orange-100 text-orange-800 border-orange-200",
  conflict: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-gray-100 text-gray-700 border-gray-200",
}

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  matched: "Rattachée",
  pending_validation: "À valider",
  conflict: "Divergence",
  rejected: "Rejetée",
}

function formatReceivedAt(dateStr: string): string {
  return format(new Date(dateStr), "d MMM", { locale: fr })
}

function errorMessage(code?: string): string {
  switch (code) {
    case "FORBIDDEN":
      return "Action non autorisée."
    case "INVALID_STATE":
      return "Cette réponse a déjà été traitée."
    case "UNAUTHORIZED":
      return "Session expirée, reconnectez-vous."
    default:
      return "Une erreur est survenue. Réessayez."
  }
}

function guestName(r: Pick<RsvpResponse, "first_name" | "last_name">): string {
  return [r.first_name, r.last_name].filter(Boolean).join(" ") || "—"
}

export function RsvpResponsesPanel({ guests, data }: Props) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState("")

  const matchedGuestIds = useMemo(
    () => new Set(data.matched.map((r) => r.guest_id).filter((id): id is string => !!id)),
    [data.matched]
  )

  const availableGuests = useMemo(() => {
    const unmatched = guests.filter((g) => !matchedGuestIds.has(g.id))
    if (!filterText.trim()) return unmatched
    const q = filterText.trim().toLowerCase()
    return unmatched.filter((g) =>
      [g.first_name, g.last_name, g.email].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    )
  }, [guests, matchedGuestIds, filterText])

  const treated = useMemo(
    () =>
      [...data.matched, ...data.rejected].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [data.matched, data.rejected]
  )

  function openLinking(responseId: string) {
    setLinkingId(responseId === linkingId ? null : responseId)
    setFilterText("")
  }

  async function handleLink(responseId: string, guestId: string) {
    setPendingId(responseId)
    const result = await linkRsvpResponseToGuest(responseId, guestId)
    setPendingId(null)
    if (result.error) {
      toast.error(errorMessage(result.error))
      return
    }
    toast.success("Réponse rattachée à l'invité.")
    setLinkingId(null)
    router.refresh()
  }

  async function handleCreate(responseId: string) {
    setPendingId(responseId)
    const result = await createGuestFromRsvpResponse(responseId)
    setPendingId(null)
    if (result.error) {
      toast.error(errorMessage(result.error))
      return
    }
    toast.success("Invité créé et réponse rattachée.")
    router.refresh()
  }

  async function handleReject(responseId: string) {
    if (!confirm("Rejeter cette réponse ? Elle sera masquée mais conservée pour traçabilité.")) return
    setPendingId(responseId)
    const result = await rejectRsvpResponse(responseId)
    setPendingId(null)
    if (result.error) {
      toast.error(errorMessage(result.error))
      return
    }
    toast.success("Réponse rejetée.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Section A — À valider */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">
          À valider {data.counts.pendingValidation > 0 && `(${data.counts.pendingValidation})`}
        </h2>

        {data.pendingValidation.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">Aucune réponse en attente de validation.</p>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invité</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Réponse</TableHead>
                  <TableHead>Nb</TableHead>
                  <TableHead>Reçue le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingValidation.map((r) => (
                  <Fragment key={r.id}>
                    <TableRow>
                      <TableCell className="font-medium">{guestName(r)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                      <TableCell>
                        {r.attending ? (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Présent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <XIcon className="h-3.5 w-3.5" aria-hidden="true" /> Absent
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{r.attending ? r.guest_count : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatReceivedAt(r.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pendingId === r.id}
                            onClick={() => openLinking(r.id)}
                            className="gap-1.5"
                          >
                            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Rattacher
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pendingId === r.id}
                            onClick={() => handleCreate(r.id)}
                            className="gap-1.5"
                          >
                            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Créer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pendingId === r.id}
                            onClick={() => handleReject(r.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Rejeter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {linkingId === r.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="space-y-2 py-1">
                            <Input
                              autoFocus
                              placeholder="Filtrer par nom ou email…"
                              value={filterText}
                              onChange={(e) => setFilterText(e.target.value)}
                              className="max-w-sm"
                            />
                            {availableGuests.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Aucun invité disponible pour ce filtre.
                              </p>
                            ) : (
                              <div className="max-h-48 divide-y overflow-y-auto rounded-md border bg-background">
                                {availableGuests.map((g) => (
                                  <button
                                    key={g.id}
                                    type="button"
                                    disabled={pendingId === r.id}
                                    onClick={() => handleLink(r.id, g.id)}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  >
                                    <span className="font-medium">
                                      {[g.first_name, g.last_name].filter(Boolean).join(" ") || "—"}
                                    </span>
                                    {g.email && (
                                      <span className="text-xs text-muted-foreground">{g.email}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Section B — Divergences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Divergences</CardTitle>
        </CardHeader>
        <CardContent>
          {data.conflict.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune divergence pour le moment. Cette section listera les réponses qui contredisent
              la liste maître (incrément à venir).
            </p>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                {data.conflict.length} réponse{data.conflict.length > 1 ? "s" : ""} en divergence
                détectée{data.conflict.length > 1 ? "s" : ""}. La vue de traitement dédiée arrive
                dans un prochain incrément.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Section C — Traitées */}
      <Accordion type="single" collapsible>
        <AccordionItem value="treated">
          <AccordionTrigger className="text-sm font-semibold">
            Réponses traitées ({treated.length})
          </AccordionTrigger>
          <AccordionContent>
            {treated.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réponse traitée pour l&apos;instant.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invité</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Réponse</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Reçue le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treated.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{guestName(r)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                      <TableCell>{r.attending ? "Présent" : "Absent"}</TableCell>
                      <TableCell>
                        <Badge className={`border text-[11px] ${RESPONSE_STATUS_BADGE[r.status]}`}>
                          {RESPONSE_STATUS_LABELS[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatReceivedAt(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

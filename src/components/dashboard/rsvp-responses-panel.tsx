"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Check, X as XIcon, UserPlus, Link2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  linkRsvpResponseToGuest,
  createGuestFromRsvpResponse,
  rejectRsvpResponse,
  resolveRsvpConflict,
} from "@/actions/rsvp"
import { RSVP_STATUS_LABELS } from "@/lib/validators/guest"
import type { Guest } from "@/queries/guests"
import type { ConflictResponse, RsvpResponse, RsvpResponsesByStatus } from "@/queries/rsvp"

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
  resolved_kept_couple: "bg-blue-100 text-blue-800 border-blue-200",
}

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  matched: "Rattachée",
  pending_validation: "À valider",
  conflict: "Divergence",
  rejected: "Rejetée",
  resolved_kept_couple: "Résolu (saisie gardée)",
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
    case "NOT_LINKED":
      return "Cette réponse doit d'abord être rattachée à un invité (section « À valider »)."
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
      [...data.matched, ...data.resolvedKeptCouple, ...data.rejected].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [data.matched, data.resolvedKeptCouple, data.rejected]
  )

  // Groupe les conflits par email : cas (b) explicite = plusieurs réponses dans un même groupe.
  const conflictsByEmail = useMemo(() => {
    const map = new Map<string, ConflictResponse[]>()
    for (const c of data.conflict) {
      const key = c.email ?? c.id
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return map
  }, [data.conflict])

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
    toast.success("Réponse rattachée à l'invité.", { duration: 3000 })
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
    toast.success("Invité créé et réponse rattachée.", { duration: 3000 })
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
    toast.success("Réponse rejetée.", { duration: 3000 })
    router.refresh()
  }

  async function handleResolve(responseId: string, resolution: "keep_couple_version" | "apply_response") {
    const confirmText =
      resolution === "keep_couple_version"
        ? "Garder votre saisie et ignorer la réponse de l'invité ?"
        : "Appliquer la réponse de l'invité et écraser votre saisie actuelle ?"
    if (!confirm(confirmText)) return
    setPendingId(responseId)
    const result = await resolveRsvpConflict(responseId, resolution)
    setPendingId(null)
    if (result.error) {
      toast.error(errorMessage(result.error))
      return
    }
    toast.success("Conflit résolu.", { duration: 3000 })
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
          <EmptyState
            icon={UserPlus}
            size="sm"
            title="Aucune réponse en attente de validation."
          />
        ) : (
          <div className="space-y-3">
            {data.pendingValidation.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{guestName(r)}</p>
                    <p className="text-sm text-muted-foreground">{r.email ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    {r.attending ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-700">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Présent{r.guest_count > 1 ? `, ${r.guest_count} pers.` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <XIcon className="h-3.5 w-3.5" aria-hidden="true" /> Absent
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">Reçue le {formatReceivedAt(r.created_at)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
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

                {linkingId === r.id && (
                  <div className="mt-3 space-y-2 rounded-md bg-muted/30 p-3">
                    <Input
                      autoFocus
                      placeholder="Filtrer par nom ou email…"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B — Divergences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Divergences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.conflict.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              size="sm"
              title="Aucune divergence pour le moment."
              description="Cette section liste les réponses qui contredisent la liste maître, ou qui divergent d'une réponse précédente pour le même email."
            />
          ) : (
            [...conflictsByEmail.entries()].map(([key, group]) => (
              <div key={key} className="space-y-3 rounded-xl border p-4">
                {group.length > 1 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      ⚠️ Cet email a répondu plusieurs fois de façon divergente ({group.length} réponses).
                    </AlertDescription>
                  </Alert>
                )}
                {group.map((c) => (
                  <div key={c.id} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">
                          {c.guest
                            ? [c.guest.first_name, c.guest.last_name].filter(Boolean).join(" ") || "—"
                            : guestName(c)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">{c.email ?? "—"}</span>
                      </div>
                      <Badge className={`border text-xs ${RESPONSE_STATUS_BADGE.conflict}`}>
                        {RESPONSE_STATUS_LABELS.conflict}
                      </Badge>
                    </div>

                    {c.guest ? (
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <span className="text-xs text-muted-foreground">Vous aviez noté</span>
                          <p className="font-medium">
                            {RSVP_STATUS_LABELS[c.guest.rsvp_status as keyof typeof RSVP_STATUS_LABELS] ??
                              c.guest.rsvp_status}
                          </p>
                        </div>
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <span className="text-xs text-muted-foreground">L&apos;invité répond</span>
                          <p className="font-medium">
                            {c.attending ? `Présent, ${c.guest_count} pers.` : "Absent"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Réponses contradictoires pour cet email non rattaché — traiter d&apos;abord
                        dans « À valider ».
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!c.guest_id || pendingId === c.id}
                        onClick={() => handleResolve(c.id, "keep_couple_version")}
                      >
                        Garder votre saisie
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!c.guest_id || pendingId === c.id}
                        onClick={() => handleResolve(c.id, "apply_response")}
                      >
                        Appliquer la réponse invité
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))
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
              <div className="space-y-2">
                {treated.map((r) => (
                  <div key={r.id} className="rounded-lg border px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">{guestName(r)}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{r.email ?? "—"}</span>
                      </div>
                      <Badge className={`border text-xs ${RESPONSE_STATUS_BADGE[r.status]}`}>
                        {RESPONSE_STATUS_LABELS[r.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                      <span>{r.attending ? `Présent${r.guest_count > 1 ? `, ${r.guest_count} pers.` : ""}` : "Absent"}</span>
                      <span>Reçue le {formatReceivedAt(r.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

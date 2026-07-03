"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BUDGET_CATEGORIES } from "@/lib/validators/budget"
import { deleteBudgetItem } from "@/actions/budget"
import { BudgetItemForm } from "./budget-item-form"
import type { BudgetItem } from "@/queries/budget"

interface Props {
  initialItems: BudgetItem[]
  weddingId: string
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €"
}

function SummaryCard({
  label,
  amount,
  variant = "default",
}: {
  label: string
  amount: number
  variant?: "default" | "accent" | "muted"
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        variant === "accent" && "border-primary/30 bg-primary/5",
        variant === "muted" && "bg-muted/50"
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums",
          variant === "accent" && "text-primary"
        )}
      >
        {fmt(amount)}
      </p>
    </div>
  )
}

interface CategoryGroupProps {
  category: string
  items: BudgetItem[]
  onEdit: (item: BudgetItem) => void
  onDelete: (itemId: string) => void
}

function CategoryGroup({ category, items, onEdit, onDelete }: CategoryGroupProps) {
  const [open, setOpen] = useState(true)

  const estimated = items.reduce((s, i) => s + Number(i.estimated_amount), 0)
  const paid = items.reduce((s, i) => s + Number(i.paid_amount), 0)
  const pct = estimated > 0 ? Math.min(100, Math.round((paid / estimated) * 100)) : 0

  return (
    <div className="rounded-xl border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{category}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums text-muted-foreground">{fmt(estimated)}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      {estimated > 0 && (
        <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% payé`}
          />
        </div>
      )}

      {open && (
        <div className="mt-2">
          {items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Estimé : {fmt(Number(item.estimated_amount))}</span>
                    {item.actual_amount !== null && (
                      <span>Réel : {fmt(Number(item.actual_amount))}</span>
                    )}
                    <span>Payé : {fmt(Number(item.paid_amount))}</span>
                    {item.vendor && <span>{item.vendor}</span>}
                    {item.notes && <span className="italic">{item.notes}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={`Modifier ${item.name}`}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    aria-label={`Supprimer ${item.name}`}
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function BudgetEditor({ initialItems, weddingId }: Props) {
  const [items, setItems] = useState(initialItems)
  const [addOpen, setAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const router = useRouter()

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  async function handleDelete(itemId: string) {
    const result = await deleteBudgetItem(itemId)
    if (result.error) {
      toast.error("Erreur lors de la suppression.")
      return
    }
    toast.success("Poste supprimé", { duration: 3000 })
    router.refresh()
  }

  const totalEstimated = items.reduce((s, i) => s + Number(i.estimated_amount), 0)
  const totalActual = items.reduce((s, i) => s + Number(i.actual_amount ?? i.estimated_amount), 0)
  const totalPaid = items.reduce((s, i) => s + Number(i.paid_amount), 0)
  const totalRemaining = totalEstimated - totalPaid

  const grouped: { category: string; items: BudgetItem[] }[] = BUDGET_CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  const uncategorized = items.filter(
    (i) => !(BUDGET_CATEGORIES as readonly string[]).includes(i.category)
  )
  if (uncategorized.length > 0) {
    grouped.push({ category: "Autre", items: uncategorized })
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Budget estimé total" amount={totalEstimated} />
        <SummaryCard label="Dépensé (réel)" amount={totalActual} variant="accent" />
        <SummaryCard label="Reste à payer" amount={totalRemaining} variant="muted" />
      </div>

      {/* Category groups */}
      {grouped.length > 0 && (
        <div className="space-y-3">
          {grouped.map(({ category, items: catItems }) => (
            <CategoryGroup
              key={category}
              category={category}
              items={catItems}
              onEdit={(item) => {
                setEditingItem(item)
                setAddOpen(false)
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {grouped.length === 0 && !addOpen && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun poste budgétaire pour l&apos;instant.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Ajoutez votre premier poste pour commencer.
          </p>
        </div>
      )}

      {/* Edit inline form */}
      {editingItem && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-4 text-sm font-semibold">Modifier le poste</h3>
          <BudgetItemForm mode="edit" item={editingItem} onDone={() => setEditingItem(null)} />
        </div>
      )}

      {/* Add inline form */}
      {addOpen && !editingItem && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-4 text-sm font-semibold">Nouveau poste</h3>
          <BudgetItemForm mode="add" weddingId={weddingId} onDone={() => setAddOpen(false)} />
        </div>
      )}

      {!addOpen && !editingItem && (
        <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un poste
        </Button>
      )}
    </div>
  )
}

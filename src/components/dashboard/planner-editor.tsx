"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, Pencil, Trash2, CheckCircle2, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLANNER_CATEGORIES, PRIORITY_LABELS, PRIORITY_BADGE } from "@/lib/validators/planner"
import {
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/actions/planner"
import { PlannerItemForm } from "./planner-item-form"
import type { ChecklistItem } from "@/queries/planner"

interface Props {
  initialItems: ChecklistItem[]
  weddingId: string
}

export function PlannerEditor({ initialItems, weddingId }: Props) {
  const [items, setItems] = useState(initialItems)
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const filtered =
    priorityFilter === "all" ? items : items.filter((i) => i.priority === priorityFilter)
  const completed = items.filter((i) => i.is_completed).length
  const total = items.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  async function handleToggle(item: ChecklistItem) {
    const newVal = !item.is_completed
    setTogglingIds((prev) => new Set(prev).add(item.id))
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: newVal } : i)))
    const result = await toggleChecklistItem(item.id, newVal)
    setTogglingIds((prev) => {
      const s = new Set(prev)
      s.delete(item.id)
      return s
    })
    if (result.error) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i))
      )
      toast.error("Erreur lors de la mise à jour")
    }
  }

  async function handleAdd(values: {
    category: string
    title: string
    description?: string
    due_date?: string
    priority: "high" | "medium" | "low"
  }) {
    const result = await createChecklistItem({
      weddingId,
      category: values.category,
      title: values.title,
      description: values.description || null,
      due_date: values.due_date || null,
      priority: values.priority,
    })
    if (result.error) {
      toast.error("Erreur lors de l'ajout")
      return
    }
    setAddingToCategory(null)
    router.refresh()
  }

  async function handleEdit(
    id: string,
    values: {
      category?: string
      title?: string
      description?: string
      due_date?: string
      priority?: "high" | "medium" | "low"
    }
  ) {
    const result = await updateChecklistItem({
      itemId: id,
      category: values.category,
      title: values.title,
      description: values.description || null,
      due_date: values.due_date || null,
      priority: values.priority,
    })
    if (result.error) {
      toast.error("Erreur lors de la modification")
      return
    }
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(itemId: string) {
    const result = await deleteChecklistItem(itemId)
    if (result.error) {
      toast.error("Erreur lors de la suppression")
      return
    }
    router.refresh()
  }

  const allCategories: string[] = [
    ...PLANNER_CATEGORIES,
    ...Array.from(
      new Set(
        items
          .filter((i) => !(PLANNER_CATEGORIES as readonly string[]).includes(i.category))
          .map((i) => i.category)
      )
    ),
  ]

  if (total === 0 && addingToCategory === null) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Aucune tâche pour l'instant."
        description="Ajoutez vos premières tâches pour suivre l'avancement de vos préparatifs."
        action={{ label: "Nouvelle tâche", onClick: () => setAddingToCategory("custom") }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {total > 0 && (
        <>
          {/* Progress */}
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {completed}/{total} tâches complétées
              </span>
              <span className="text-sm font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Toutes les tâches sont complétées !
              </div>
            )}
          </div>

          {/* Filter + add custom */}
          <div className="flex items-center justify-between">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Toutes les priorités
                </SelectItem>
                {(["high", "medium", "low"] as const).map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingToCategory("custom")
                setEditingId(null)
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tâche personnalisée
            </Button>
          </div>
        </>
      )}

      {addingToCategory === "custom" && (
        <PlannerItemForm
          mode="add"
          onSubmit={handleAdd}
          onCancel={() => setAddingToCategory(null)}
        />
      )}

      {/* Category sections */}
      {total > 0 &&
        allCategories.map((category) => {
          const catItems = filtered.filter((i) => i.category === category)
          const catCompleted = items.filter((i) => i.category === category && i.is_completed).length
          const catTotal = items.filter((i) => i.category === category).length
          const isAddingHere = addingToCategory === category

          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{category}</h3>
                  <span className="text-xs text-muted-foreground">
                    {catCompleted}/{catTotal}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setAddingToCategory(category)
                    setEditingId(null)
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-0.5">
                {catItems.map((item) =>
                  editingId === item.id ? (
                    <PlannerItemForm
                      key={item.id}
                      mode="edit"
                      item={item}
                      onSubmit={(v) => handleEdit(item.id, v)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={item.is_completed}
                        disabled={togglingIds.has(item.id)}
                        onCheckedChange={() => handleToggle(item)}
                        aria-label={`Marquer "${item.title}" comme ${item.is_completed ? "non complétée" : "complétée"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-sm",
                            item.is_completed && "text-muted-foreground line-through"
                          )}
                        >
                          {item.title}
                        </span>
                        {item.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.due_date && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(parseISO(item.due_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      )}
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                          PRIORITY_BADGE[item.priority]
                        )}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditingId(item.id)
                            setAddingToCategory(null)
                          }}
                          aria-label={`Modifier "${item.title}"`}
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Supprimer "${item.title}"`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
                {catItems.length === 0 && !isAddingHere && (
                  <p className="py-2 pl-2 text-xs text-muted-foreground">
                    Aucune tâche{priorityFilter !== "all" ? " pour ce filtre" : ""}.
                  </p>
                )}
              </div>

              {isAddingHere && (
                <PlannerItemForm
                  mode="add"
                  defaultCategory={category}
                  onSubmit={handleAdd}
                  onCancel={() => setAddingToCategory(null)}
                />
              )}
            </div>
          )
        })}
    </div>
  )
}

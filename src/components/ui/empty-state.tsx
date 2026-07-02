import type { LucideIcon } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateAction {
  label: string
  href?: Route
  onClick?: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  size?: "md" | "sm"
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, size = "md", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed text-center",
        size === "md" ? "py-16" : "py-8",
        className
      )}
    >
      <Icon
        className={cn("mb-3 text-muted-foreground/50", size === "md" ? "h-8 w-8" : "h-6 w-6")}
        aria-hidden="true"
      />
      <p className={cn("font-medium", size === "md" ? "text-sm" : "text-sm")}>{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button asChild={!!action.href} onClick={action.onClick} className="mt-4" size="sm">
          {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
        </Button>
      )}
    </div>
  )
}

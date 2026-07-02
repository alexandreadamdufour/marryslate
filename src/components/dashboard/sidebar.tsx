"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import type { Route } from "next"
import {
  LayoutDashboard,
  Gift,
  Globe,
  Heart,
  Users,
  Banknote,
  Settings,
  BookOpen,
  PiggyBank,
  Table2,
  CheckSquare,
  CalendarDays,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface NavItem {
  href: Route
  label: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/site", label: "Mon site mariage", icon: Globe },
  { href: "/dashboard/programme", label: "Programme", icon: CalendarDays },
  { href: "/dashboard/planner", label: "Planner", icon: CheckSquare },
  { href: "/dashboard/liste", label: "Liste de cadeaux", icon: Gift },
  { href: "/dashboard/cagnotte", label: "Cagnotte", icon: Heart },
  { href: "/dashboard/contributions", label: "Contributions", icon: Users },
  { href: "/dashboard/invites", label: "Invités", icon: Users },
  { href: "/dashboard/plan-de-table", label: "Plan de table", icon: Table2 },
  { href: "/dashboard/budget", label: "Budget", icon: PiggyBank },
  { href: "/dashboard/livre-d-or", label: "Livre d'or", icon: BookOpen },
  { href: "/dashboard/retrait", label: "Retrait", icon: Banknote },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function AccountFooter() {
  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <span className="text-sm text-muted-foreground">Mon compte</span>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile header — hamburger + logo, remplace la sidebar sous md */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Logo />
        <Sheet open={open} onOpenChange={setOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <SheetContent side="left" className="flex w-3/4 max-w-xs flex-col p-0">
            <SheetHeader className="h-14 justify-center border-b border-border px-6">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <Logo hideLink />
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-4" aria-label="Navigation principale">
              <NavList onNavigate={() => setOpen(false)} />
            </nav>
            <AccountFooter />
          </SheetContent>
        </Sheet>
      </header>

      {/* Sidebar desktop fixe */}
      <aside className="hidden h-screen w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto p-4" aria-label="Navigation principale">
          <NavList />
        </nav>
        <AccountFooter />
      </aside>
    </>
  )
}

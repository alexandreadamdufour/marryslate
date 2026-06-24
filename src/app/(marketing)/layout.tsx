import { Logo } from "@/components/shared/logo"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link
              href="/comment-ca-marche"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Comment ça marche
            </Link>
            <Link
              href="/tarifs"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Tarifs
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/connexion">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/inscription">Créer mon site</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <Logo className="text-lg" />
            <div className="flex gap-6">
              <Link href="/mentions-legales" className="hover:text-foreground">
                Mentions légales
              </Link>
              <Link href="/cgu" className="hover:text-foreground">
                CGU
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WeddingNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="font-serif text-8xl text-muted-foreground">404</p>
      <h1 className="font-serif text-2xl">Ce site mariage est introuvable</h1>
      <p className="max-w-sm text-muted-foreground">
        Le lien que vous avez suivi ne correspond à aucun site mariage actif. Il a peut-être été
        dépublié ou le lien est incorrect.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline">
          <Link href="/trouver-une-liste">Trouver une liste</Link>
        </Button>
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  )
}

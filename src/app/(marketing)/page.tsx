import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Liste de mariage & cagnotte en ligne | Amora",
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto flex flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32">
        <h1 className="max-w-3xl text-4xl leading-tight sm:text-5xl md:text-6xl">
          Votre liste de mariage,{" "}
          <span className="text-primary">élégante et simple</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Créez votre liste de cadeaux et votre site de mariage personnalisé en moins de 2 minutes.
          Partagez le lien avec vos invités.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/comment-ca-marche">Voir comment ça marche</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl">Tout pour votre mariage, au même endroit</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl bg-card p-6 shadow-sm">
                <div className="mb-4 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 text-lg font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center sm:px-6">
        <h2 className="mb-4 text-3xl">Prêt·e à commencer ?</h2>
        <p className="mb-8 text-muted-foreground">
          Rejoignez les couples qui font confiance à Amora pour leur mariage.
        </p>
        <Button asChild size="lg">
          <Link href="/inscription">Créer mon site gratuitement</Link>
        </Button>
      </section>
    </>
  )
}

const FEATURES = [
  {
    emoji: "🎁",
    title: "Liste de cadeaux",
    description:
      "Créez votre liste, vos invités participent en ligne. Suivez les contributions en temps réel.",
  },
  {
    emoji: "💝",
    title: "Cagnotte libre",
    description:
      "En complément de votre liste, acceptez les contributions libres pour financer votre projet.",
  },
  {
    emoji: "🌐",
    title: "Site de mariage",
    description:
      "Un site personnalisé à votre image avec hero, programme, lieu, RSVP et livre d'or.",
  },
  {
    emoji: "📱",
    title: "Mobile-first",
    description: "60% de vos invités sont sur mobile. Amora est pensé mobile avant tout.",
  },
  {
    emoji: "💸",
    title: "Retraits simples",
    description: "Retirez les fonds collectés directement sur votre compte bancaire, quand vous voulez.",
  },
  {
    emoji: "🔒",
    title: "Paiements sécurisés",
    description: "Partenariat Mangopay, agréé ACPR. Vos fonds sont cantonnés et protégés.",
  },
]

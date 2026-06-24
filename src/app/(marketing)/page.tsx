import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: { absolute: "Amora — Liste de mariage & cagnotte en ligne" },
  description:
    "Créez votre liste de mariage et votre site personnalisé en 2 minutes. Vos invités participent en ligne, vous retirez les fonds quand vous voulez.",
  openGraph: {
    title: "Amora — Liste de mariage & cagnotte en ligne",
    description:
      "Créez votre liste de mariage et votre site personnalisé en 2 minutes.",
    type: "website",
  },
}

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr"}/#website`,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr",
      name: "Amora",
      description: "Liste de mariage & cagnotte en ligne",
      inLanguage: "fr-FR",
    },
    {
      "@type": "Organization",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr"}/#organization`,
      name: "Amora",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "https://amora.fr",
      description: "Plateforme française de liste de mariage et site de mariage en ligne.",
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

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
                <div className="mb-4 text-3xl" aria-hidden="true">{f.emoji}</div>
                <h3 className="mb-2 text-lg font-medium">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / chiffres */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 px-4 py-24">
        <div className="container mx-auto text-center sm:px-6">
          <h2 className="mb-4 text-3xl">Prêt·e à commencer ?</h2>
          <p className="mb-8 text-muted-foreground">
            Création gratuite. Aucun abonnement. Seulement 2,9&nbsp;% + 0,30&nbsp;€ par contribution reçue.
          </p>
          <Button asChild size="lg">
            <Link href="/inscription">Créer mon site gratuitement</Link>
          </Button>
        </div>
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
      "En complément de votre liste, acceptez les contributions libres pour financer votre voyage de noces.",
  },
  {
    emoji: "🌐",
    title: "Site de mariage",
    description:
      "Un site personnalisé à votre image : hero, programme, lieu, informations pratiques.",
  },
  {
    emoji: "📱",
    title: "Mobile-first",
    description: "60 % de vos invités sont sur mobile. Amora est pensé mobile avant tout.",
  },
  {
    emoji: "💸",
    title: "Retraits simples",
    description: "Retirez les fonds collectés directement sur votre compte bancaire, quand vous voulez.",
  },
  {
    emoji: "🔒",
    title: "Paiements sécurisés",
    description: "Propulsé par Stripe. Vos données et celles de vos invités sont protégées.",
  },
]

const STATS = [
  { value: "2 min", label: "pour créer votre site" },
  { value: "0 €", label: "d'abonnement" },
  { value: "2,9 %", label: "de commission par transaction" },
]

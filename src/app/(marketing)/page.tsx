import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { env } from "@/lib/env"
import { INSCRIPTION_ROUTE } from "@/lib/constants"

// Photo réelle du mariage démo alexetlouise (même cover_image_url que le
// site public) — recréation fidèle du hero réel plutôt qu'une capture
// d'écran statique (pas de moyen fiable de sauvegarder les octets d'une
// capture navigateur comme asset dans ce contexte). Contenu de l'overlay
// figé intentionnellement (mockup, pas de requête live sur ce wedding).
const DEMO_WEDDING_COVER_URL =
  "https://pcmramsqelydvaekslsn.supabase.co/storage/v1/object/public/gift-images/9b3eee73-45bf-4baf-a2d7-0fa790f1660f/cover-1783003759790.jpeg"

export const metadata: Metadata = {
  title: { absolute: "Marryslate — Liste de mariage & cagnotte en ligne" },
  description:
    "Créez votre liste de mariage et votre site personnalisé en 2 minutes. Vos invités participent en ligne, vous retirez les fonds quand vous voulez.",
  openGraph: {
    title: "Marryslate — Liste de mariage & cagnotte en ligne",
    description: "Créez votre liste de mariage et votre site personnalisé en 2 minutes.",
    type: "website",
  },
}

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${env.NEXT_PUBLIC_APP_URL}/#website`,
      url: env.NEXT_PUBLIC_APP_URL,
      name: "Marryslate",
      description: "Liste de mariage & cagnotte en ligne",
      inLanguage: "fr-FR",
    },
    {
      "@type": "Organization",
      "@id": `${env.NEXT_PUBLIC_APP_URL}/#organization`,
      name: "Marryslate",
      url: env.NEXT_PUBLIC_APP_URL,
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
      <section className="container mx-auto grid gap-16 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-32 lg:pt-16">
        {/* Contenu gauche */}
        <div className="flex animate-fade-in-up flex-col items-start gap-6 text-left lg:col-span-5">
          <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Nouveau · Français
          </span>
          <h1 className="text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Votre mariage mérite mieux qu&apos;un <span className="text-primary">tableur</span>.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Créez votre site de mariage, gérez votre cagnotte, votre liste de cadeaux et vos
            invités. Pensé en France, sans abonnement.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={INSCRIPTION_ROUTE} aria-label="Créer mon site de mariage gratuitement">
                Créer mon site
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link
                href="/m/alexetlouise"
                aria-label="Voir un exemple de site de mariage Marryslate"
              >
                Voir un exemple
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gratuit · Aucune carte requise · 2 minutes
          </p>
        </div>

        {/* Visuel droite */}
        <div className="relative lg:col-span-7 lg:-mr-6 xl:-mr-12">
          <div
            className="absolute -inset-8 -z-10 rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />
          <div className="animate-fade-in-scale">
            <div className="lg:[transform:perspective(1200px)_rotateY(-6deg)_rotateX(2deg)] motion-safe:lg:animate-float">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
                {/* Barre de navigateur factice */}
                <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/30" aria-hidden="true" />
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary/40" aria-hidden="true" />
                  <span className="ml-3 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                    marryslate.com/m/alexetlouise
                  </span>
                </div>
                {/* Recréation du hero réel */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10]">
                  <Image
                    src={DEMO_WEDDING_COVER_URL}
                    alt="Aperçu du site de mariage d'Alex et Louise créé avec Marryslate"
                    fill
                    priority
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white">
                    <p className="text-xs uppercase tracking-widest">Mariage</p>
                    <p className="font-serif text-3xl sm:text-4xl">
                      Alex <span className="text-primary">&amp;</span> Louise
                    </p>
                    <p className="font-serif text-2xl text-primary">J-8</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl">Tout pour votre mariage, au même endroit</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl bg-card p-6 shadow-sm">
                <div className="mb-4 text-3xl" aria-hidden="true">
                  {f.emoji}
                </div>
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
            Création gratuite. Aucun abonnement. Seulement 2,9&nbsp;% + 0,30&nbsp;€ par contribution
            reçue.
          </p>
          <Button asChild size="lg">
            <Link href={INSCRIPTION_ROUTE}>Créer mon site gratuitement</Link>
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
    description: "60 % de vos invités sont sur mobile. Marryslate est pensé mobile avant tout.",
  },
  {
    emoji: "💸",
    title: "Retraits simples",
    description:
      "Retirez les fonds collectés directement sur votre compte bancaire, quand vous voulez.",
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

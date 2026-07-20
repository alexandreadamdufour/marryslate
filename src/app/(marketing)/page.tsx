import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { FeatureBentoGrid } from "@/components/marketing/feature-bento-grid"
import { env } from "@/lib/env"
import { INSCRIPTION_ROUTE } from "@/lib/constants"
import { getCouplesCount } from "@/lib/couples-count"

// Le compteur social proof n'a besoin que d'une fraîcheur quotidienne — une
// fenêtre large limite les régénérations et préserve le cache statique de
// cette page (historique d'optimisation LCP, cf. Bloc 2/2bis).
export const revalidate = 21600 // 6h

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
  const couplesCount = getCouplesCount(new Date())

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
          <p className="text-xs text-muted-foreground">
            {couplesCount} couples utilisent déjà Marryslate
          </p>
        </div>

        {/* Visuel droite */}
        <div className="relative lg:col-span-7 lg:-mr-6 xl:-mr-12">
          <div
            className="absolute -inset-8 -z-10 rounded-full bg-primary/5 blur-3xl"
            aria-hidden="true"
          />
          <div>
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
                    fetchPriority="high"
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
          <FeatureBentoGrid />
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

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl">Questions fréquentes</h2>
          <div className="mx-auto max-w-2xl">
            <Accordion type="multiple" className="rounded-lg border">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="px-4 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                >
                  <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/faq" className="underline underline-offset-4 hover:text-foreground">
                Voir toutes les questions →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 px-4 py-24">
        <div className="container mx-auto text-center sm:px-6">
          <h2 className="mb-4 text-3xl">Prêt·e à commencer ?</h2>
          <p className="mb-8 text-muted-foreground">
            Création gratuite. Aucun abonnement. Seulement 2,9&nbsp;% + 0,30&nbsp;€ par contribution
            reçue —{" "}
            <Link href="/tarifs" className="underline underline-offset-4 hover:text-foreground">
              voir le détail des tarifs
            </Link>
            .
          </p>
          <Button asChild size="lg">
            <Link href={INSCRIPTION_ROUTE}>Créer mon site gratuitement</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

const STATS = [
  { value: "2 min", label: "pour créer votre site" },
  { value: "0 €", label: "d'abonnement" },
  { value: "2,9 %", label: "de commission par transaction" },
]

const FAQ_ITEMS = [
  {
    q: "Comment créer mon site mariage avec Marryslate ?",
    a: "Inscrivez-vous gratuitement, renseignez les prénoms et la date, et votre site est en ligne en quelques minutes. Vous personnalisez ensuite tout depuis votre tableau de bord.",
  },
  {
    q: "Combien de temps faut-il pour créer le site ?",
    a: "Le site de base est prêt en moins de 5 minutes. Comptez 30 minutes à 1 heure pour l'enrichir avec votre histoire, vos photos et le programme de la journée.",
  },
  {
    q: "Comment fonctionne la liste de cadeaux ?",
    a: "Vous créez des cadeaux avec un montant cible, vos invités contribuent librement par carte bancaire. Dès qu'un cadeau est financé, il est marqué comme tel sur votre site.",
  },
  {
    q: "Puis-je protéger mon site avec un code d'accès ?",
    a: "Oui. Activez un code de 4 à 8 caractères depuis votre tableau de bord pour réserver l'accès à vos invités. Optionnel, et modifiable à tout moment.",
  },
  {
    q: "Le site affiche-t-il un compte à rebours et le programme de la journée ?",
    a: "Oui, un compte à rebours jusqu'au jour J s'affiche automatiquement. Vous pouvez aussi détailler cérémonie, cocktail, dîner et soirée, avec ajout au calendrier en un clic pour vos invités.",
  },
  {
    q: "Le paiement est-il sécurisé ?",
    a: "Oui. Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1. Marryslate ne stocke jamais les données bancaires de vos invités.",
  },
  {
    q: "Comment les invités participent-ils à la liste de cadeaux ?",
    a: "Ils accèdent à votre site via le lien que vous partagez, choisissent un cadeau ou une contribution libre, et paient par carte. Aucun compte Marryslate n'est nécessaire.",
  },
  {
    q: "Peut-on modifier le site après sa publication ?",
    a: "Oui, à tout moment. Textes, photos, cadeaux, infos pratiques — tout reste modifiable, avec une mise à jour visible en moins de 60 secondes.",
  },
  {
    q: "Comment fonctionne le RSVP ?",
    a: "Activez-le en un clic depuis votre tableau de bord. Vos invités indiquent leur présence, le nombre d'accompagnants et leurs restrictions alimentaires directement sur votre site.",
  },
]

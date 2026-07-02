import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { INSCRIPTION_ROUTE } from "@/lib/constants"
import {
  UserCheck,
  BookHeart,
  CalendarDays,
  MapPin,
  Timer,
  Lock,
  ArrowRight,
  Gift,
  QrCode,
  Palette,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Comment ça marche — Marryslate",
  description:
    "Créez votre site de mariage et liste de cadeaux en 2 minutes. RSVP, livre d'or, QR code inclus. Découvrez comment Marryslate fonctionne étape par étape.",
}

const STEPS = [
  {
    number: "01",
    title: "Créez votre site en 2 minutes",
    description:
      "Inscription sans carte bancaire. En quelques clics, votre site est en ligne avec votre URL personnalisée.",
    details: [
      { icon: UserCheck, label: "Inscription avec votre email — aucune carte requise" },
      { icon: ArrowRight, label: "Choisissez votre slug : marryslate.com/m/sofia-et-thomas" },
      { icon: Palette, label: "Couleur principale, police de titres, thème Classique ou Contemporain" },
      { icon: QrCode, label: "QR code généré automatiquement, prêt pour vos faire-part" },
    ],
  },
  {
    number: "02",
    title: "Ajoutez vos cadeaux et activez la cagnotte",
    description:
      "Construisez votre liste à votre image. Cadeaux précis, cagnotte libre, ou les deux.",
    details: [
      { icon: Gift, label: "Titre, description, montant cible et photo pour chaque cadeau" },
      { icon: ArrowRight, label: "Catégories : Cuisine, Voyage, Maison, Expériences, Loisirs…" },
      { icon: ArrowRight, label: "Contributions partielles — vos invités participent à la hauteur qu'ils souhaitent" },
      { icon: ArrowRight, label: "Cagnotte libre en parallèle pour les contributions sans objectif" },
    ],
  },
  {
    number: "03",
    title: "Partagez et recevez",
    description:
      "Un lien, un QR code — vos invités contribuent en quelques secondes. L'argent arrive directement sur votre compte.",
    details: [
      { icon: ArrowRight, label: "Partagez le lien dans vos invitations ou par SMS" },
      { icon: ArrowRight, label: "Vos invités paient par carte en moins de 2 minutes, sans créer de compte" },
      { icon: ArrowRight, label: "Tableau de bord en temps réel : qui a contribué, combien, pour quel cadeau" },
      { icon: ArrowRight, label: "Retrait sur votre compte bancaire en 1 à 3 jours ouvrés, sans frais" },
    ],
  },
]

const FEATURES = [
  {
    icon: UserCheck,
    title: "RSVP en ligne",
    description:
      "Un formulaire intégré à votre site. Vos invités confirment leur présence, le nombre de personnes et leurs contraintes alimentaires.",
  },
  {
    icon: BookHeart,
    title: "Livre d'or",
    description:
      "Vos proches laissent des messages de vœux avant ou après le mariage. Vous les recevez par email et les retrouvez dans votre dashboard.",
  },
  {
    icon: CalendarDays,
    title: "Programme de la journée",
    description:
      "Cérémonie, cocktail, dîner, soirée — chaque étape est ajoutable au calendrier Google, Apple ou Outlook en un clic.",
  },
  {
    icon: MapPin,
    title: "Infos pratiques",
    description:
      "Lieux avec lien Google Maps, dress code, hébergements recommandés avec fourchette de prix et lien de réservation.",
  },
  {
    icon: Timer,
    title: "Compte à rebours",
    description:
      "Un compte à rebours affiché sur votre site public jusqu'au jour J, visible par vos invités dès la première visite.",
  },
  {
    icon: Lock,
    title: "Code d'accès",
    description:
      "Protégez votre site avec un code à 4–8 caractères. Seuls vos invités qui connaissent le code peuvent accéder à votre page.",
  },
]

export default function CommentCaMarchePage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 md:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
          Comment ça marche
        </p>
        <h1 className="mb-6 text-4xl leading-tight sm:text-5xl md:text-6xl">
          De zéro à votre site mariage{" "}
          <span className="text-primary">en 2 minutes</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Aucune compétence technique requise. Aucune carte bancaire pour commencer. Tout ce qu&apos;il
          faut pour que vos invités vous gâtent — au même endroit.
        </p>
      </section>

      {/* 3 étapes */}
      <section className="pb-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative rounded-2xl border bg-card p-8 shadow-sm">
                {/* Connector line between steps */}
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute -bottom-6 left-[3.25rem] hidden h-6 w-px bg-border sm:block"
                    aria-hidden="true"
                  />
                )}

                <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                  {/* Number badge */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>

                  <div className="flex-1">
                    <h2 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h2>
                    <p className="mb-5 text-muted-foreground">{step.description}</p>

                    <ul className="grid gap-2 sm:grid-cols-2" aria-label={`Détails : ${step.title}`}>
                      {step.details.map((d) => (
                        <li key={d.label} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/10 p-0.5 text-primary">
                            <d.icon className="h-full w-full" aria-hidden="true" />
                          </div>
                          {d.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl">
              Tout ce dont vous avez besoin, inclus
            </h2>
            <p className="mt-3 text-muted-foreground">
              Fonctionnalités comprises dans votre site mariage gratuit.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prix résumé */}
      <section className="py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl sm:text-4xl">Et le prix ?</h2>
          <p className="text-lg text-muted-foreground">
            Créer votre site est <strong className="text-foreground">100 % gratuit</strong>. Marryslate
            prend <strong className="text-foreground">2,9 % + 0,30 €</strong> de commission sur
            chaque contribution reçue — seulement quand vous collectez.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/tarifs">Voir le détail des tarifs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-muted/40 px-4 py-24">
        <div className="container mx-auto max-w-xl text-center sm:px-6">
          <h2 className="mb-4 text-3xl sm:text-4xl">Prêt·e à vous lancer ?</h2>
          <p className="mb-8 text-muted-foreground">
            Votre site en ligne en 2 minutes. Aucune carte bancaire, aucun abonnement.
          </p>
          <Button asChild size="lg">
            <Link href={INSCRIPTION_ROUTE}>Créer mon site gratuitement</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

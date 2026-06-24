import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Créez votre liste de mariage et votre site personnalisé en 4 étapes simples avec Amora.",
}

const STEPS = [
  {
    number: "01",
    title: "Créez votre compte",
    description:
      "Inscrivez-vous en 30 secondes avec votre email. Aucune carte bancaire requise pour commencer.",
  },
  {
    number: "02",
    title: "Personnalisez votre site",
    description:
      "Renseignez vos prénoms, la date, le lieu. Choisissez votre thème, ajoutez une photo de couverture et votre histoire.",
  },
  {
    number: "03",
    title: "Créez votre liste de cadeaux",
    description:
      "Ajoutez des cadeaux avec un nom, une description, une photo et un montant cible. Vos invités voient la progression en temps réel.",
  },
  {
    number: "04",
    title: "Partagez et collectez",
    description:
      "Publiez votre site et partagez le lien. Vos invités contribuent par carte bancaire en quelques secondes. Retirez les fonds quand vous voulez.",
  },
]

const HOW_CONTRIBUTIONS = [
  {
    title: "L'invité arrive sur votre site",
    description:
      "Depuis le lien que vous partagez (par email, SMS, invitation papier avec QR code).",
  },
  {
    title: "Il choisit un cadeau ou contribue librement",
    description:
      "Il peut participer à un cadeau spécifique ou donner le montant qu'il souhaite.",
  },
  {
    title: "Il paie par carte bancaire",
    description:
      "Paiement sécurisé par Stripe en quelques secondes. Il reçoit un reçu par email.",
  },
  {
    title: "Vous recevez une notification",
    description:
      "Un email vous informe immédiatement de chaque nouvelle contribution.",
  },
]

export default function CommentCaMarchePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl sm:text-5xl">Comment ça marche</h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          De la création à la collecte, Amora vous accompagne à chaque étape.
        </p>
      </div>

      {/* 4 étapes */}
      <section className="mb-20">
        <h2 className="mb-10 text-2xl font-semibold">Créez votre site en 4 étapes</h2>
        <div className="space-y-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-6">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {step.number}
              </div>
              <div className="pt-2">
                <h3 className="mb-1 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parcours invité */}
      <section className="mb-20 rounded-2xl bg-muted/50 p-8">
        <h2 className="mb-8 text-2xl font-semibold">Le parcours de vos invités</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {HOW_CONTRIBUTIONS.map((item, i) => (
            <div key={item.title} className="flex gap-4">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tarifs résumé */}
      <section className="mb-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Et le prix ?</h2>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Créer votre site est <strong className="text-foreground">100 % gratuit</strong>. Amora
          prend <strong className="text-foreground">2,9 % + 0,30 €</strong> de commission sur
          chaque contribution reçue — seulement quand vous collectez.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tarifs">Voir les tarifs</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

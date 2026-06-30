import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCodeGeneratorClient } from "@/components/marketing/qr-code-generator-client"

export const metadata: Metadata = {
  title: "Générateur de QR code mariage gratuit — Marryslate",
  description:
    "Générez gratuitement le QR code de votre site mariage en quelques secondes. Téléchargez en PNG pour l'imprimer sur vos faire-parts et menus de table.",
}

const TIPS = [
  {
    icon: "💌",
    title: "Faire-parts",
    body: "Ajoutez votre QR code sur vos invitations pour que vos invités accèdent directement à votre liste.",
  },
  {
    icon: "🍽️",
    title: "Menus de table",
    body: "Imprimez-le en bas de vos menus : vos invités pourront contribuer depuis leur téléphone pendant le repas.",
  },
  {
    icon: "📸",
    title: "Photobooth",
    body: "Glissez-le dans votre coin photobooth pour que les photos soient facilement partagées avec le site.",
  },
]

export default function QrCodeGeneratorPage() {
  return (
    <>
      {/* Hero */}
      <section className="container mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 md:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
          Outil gratuit
        </p>
        <h1 className="mb-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Générez le QR code{" "}
          <span className="text-primary">de votre site mariage</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Imprimez-le sur vos faire-parts, menus ou photobooth — gratuit, sans inscription.
        </p>
      </section>

      {/* Generator card */}
      <section className="container mx-auto max-w-lg px-4 pb-8 sm:px-6">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <QrCodeGeneratorClient />
        </div>
      </section>

      {/* Tips */}
      <section className="container mx-auto max-w-lg px-4 pb-24 sm:px-6">
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TIPS.map((tip) => (
            <div key={tip.title} className="rounded-xl bg-muted/40 p-4">
              <p className="mb-1.5 font-medium">
                <span aria-hidden="true">{tip.icon} </span>
                {tip.title}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-muted/40 px-4 py-20">
        <div className="container mx-auto max-w-xl text-center sm:px-6">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Vous n&apos;avez pas encore votre site mariage ?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Créez votre site, votre liste de cadeaux et votre cagnotte en 2 minutes. Gratuit,
            sans abonnement.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/inscription">Créer mon site gratuitement</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/comment-ca-marche">Voir comment ça marche</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

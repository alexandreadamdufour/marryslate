import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes | Amora",
  description:
    "Toutes les réponses à vos questions sur la création de site mariage, la liste de cadeaux et la participation des invités avec Amora.",
}

const SECTIONS = [
  {
    id: "site",
    title: "Créer son site mariage",
    items: [
      {
        q: "Comment créer mon site mariage avec Amora ?",
        a: "Inscrivez-vous gratuitement, renseignez les prénoms des mariés et la date, et votre site est accessible en quelques minutes. Vous personnalisez ensuite les textes, photos, thème et liste de cadeaux depuis votre tableau de bord.",
      },
      {
        q: "Combien de temps faut-il pour créer le site ?",
        a: "Le site de base est prêt en moins de 5 minutes. L'enrichir avec votre histoire, vos photos, le programme de la journée et les infos pratiques prend généralement entre 30 minutes et 1 heure.",
      },
      {
        q: "Peut-on modifier le site après sa publication ?",
        a: "Oui, à tout moment. Vous pouvez modifier les textes, ajouter ou retirer des cadeaux, mettre à jour les infos pratiques, etc. Les modifications sont visibles en temps réel (ou sous 60 secondes grâce au cache ISR).",
      },
      {
        q: "Est-il possible d'avoir un nom de domaine personnalisé ?",
        a: "Votre site est accessible par défaut à amora.fr/m/votre-prénom. Un nom de domaine personnalisé (ex : sophie-et-thomas.fr) n'est pas encore disponible mais est prévu dans une prochaine version.",
      },
      {
        q: "Y a-t-il plusieurs thèmes graphiques disponibles ?",
        a: "Deux thèmes sont disponibles à ce jour : Classique (élégant, serif, tons neutres) et Contemporain (minimaliste, sans-serif, lignes épurées). D'autres thèmes sont en cours de développement.",
      },
    ],
  },
  {
    id: "cagnotte",
    title: "Liste de cadeaux & cagnotte",
    items: [
      {
        q: "Comment fonctionne la liste de cadeaux ?",
        a: "Vous créez des cadeaux avec un titre, une description, un montant cible et une photo optionnelle. Les invités contribuent librement au montant de leur choix via carte bancaire. Dès qu'un cadeau est entièrement financé, il est marqué comme tel sur votre site.",
      },
      {
        q: "Dans quel délai recevons-nous les fonds ?",
        a: "Les fonds sont disponibles sur votre compte Stripe Connect sous 2 à 7 jours ouvrés après chaque paiement confirmé. Vous pouvez demander un virement vers votre IBAN depuis votre tableau de bord à tout moment.",
      },
      {
        q: "Quelle est la commission prélevée sur les contributions ?",
        a: "La commission Amora est de 2,9 % + 0,30 € par transaction. Elle couvre les frais de paiement Stripe et le service Amora. Il n'y a aucun abonnement mensuel ni frais cachés.",
      },
      {
        q: "Que se passe-t-il si nous annulons notre mariage ?",
        a: "Les contributions déjà reçues et versées sur votre compte Stripe Connect ne sont pas automatiquement remboursées. Le remboursement des invités reste à votre initiative. Nous vous recommandons de contacter vos invités directement et de procéder aux remboursements via votre interface Stripe.",
      },
      {
        q: "Qu'est-ce que le KYC et pourquoi est-il nécessaire ?",
        a: "Le KYC (Know Your Customer) est une vérification d'identité imposée par la réglementation financière européenne. Stripe l'exige pour activer les virements sur votre compte. Vous devrez fournir une pièce d'identité et un justificatif de domicile. Cette démarche est 100 % en ligne et prend moins de 10 minutes.",
      },
    ],
  },
  {
    id: "invites",
    title: "Invités",
    items: [
      {
        q: "Comment les invités participent-ils à la liste de cadeaux ?",
        a: "Les invités accèdent à votre site via le lien que vous leur partagez (ex : amora.fr/m/sophie-thomas), choisissent un cadeau ou font une contribution libre, puis paient par carte bancaire. Aucun compte Amora n'est nécessaire.",
      },
      {
        q: "Le paiement est-il sécurisé ?",
        a: "Oui. Tous les paiements sont traités par Stripe, certifié PCI-DSS niveau 1 — le plus haut niveau de sécurité pour les paiements en ligne. Amora ne stocke jamais les données bancaires de vos invités.",
      },
      {
        q: "Comment fonctionne le RSVP ?",
        a: "Si vous activez le RSVP depuis votre tableau de bord, une section apparaît sur votre site public. Les invités y indiquent leur présence, le nombre d'accompagnants et leurs éventuelles restrictions alimentaires. Vous consultez les réponses dans l'espace dédié de votre dashboard.",
      },
      {
        q: "Les invités peuvent-ils laisser un message dans le livre d'or ?",
        a: "Oui. Une section Livre d'or apparaît en bas de votre site public. Les invités y laissent leur prénom et un message. Vous retrouvez tous les messages dans l'onglet \"Livre d'or\" de votre tableau de bord.",
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl">Questions fréquentes</h1>
          <p className="mt-4 text-muted-foreground">
            Tout ce que vous devez savoir avant de créer votre site mariage.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <h2 className="mb-4 text-lg font-semibold">{section.title}</h2>
              <Accordion type="multiple" className="rounded-lg border">
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.id}-${i}`}
                    className="px-4 first:rounded-t-lg last:rounded-b-lg last:border-b-0"
                  >
                    <AccordionTrigger className="text-base">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border bg-muted/30 px-6 py-10 text-center">
          <p className="font-serif text-2xl">Prêts à créer votre site ?</p>
          <p className="mt-2 text-muted-foreground">
            Gratuit, sans engagement, en ligne en 5 minutes.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/inscription">Créer mon site gratuitement</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

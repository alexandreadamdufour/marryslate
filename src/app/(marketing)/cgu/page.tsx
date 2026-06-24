import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  robots: { index: false },
}

const LAST_UPDATED = "24 juin 2026"

export default function CguPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-4xl">Conditions générales d&apos;utilisation</h1>
      <p className="mb-10 text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Objet</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et
            l&apos;utilisation de la plateforme Amora, accessible à l&apos;adresse{" "}
            <strong className="text-foreground">amora.fr</strong>. Amora est un service permettant
            aux couples de créer un site de mariage personnalisé, une liste de cadeaux et une
            cagnotte en ligne.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Acceptation des CGU</h2>
          <p className="text-muted-foreground">
            L&apos;utilisation du service implique l&apos;acceptation pleine et entière des
            présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser
            le service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Création de compte</h2>
          <p className="text-muted-foreground">
            L&apos;accès au service nécessite la création d&apos;un compte avec une adresse email
            valide. Vous êtes responsable de la confidentialité de vos identifiants. Toute
            utilisation frauduleuse devra être signalée immédiatement à{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Description du service</h2>
          <p className="text-muted-foreground">
            Amora permet aux utilisateurs (les « couples ») de :{" "}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Créer un site de mariage public personnalisé</li>
            <li>Gérer une liste de cadeaux avec objectifs de financement</li>
            <li>Recevoir des contributions financières de leurs invités</li>
            <li>Retirer les fonds collectés sur leur compte bancaire</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            La création de compte et de site est gratuite. Des frais de service s&apos;appliquent
            sur chaque contribution reçue (voir article 6).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Obligations des utilisateurs</h2>
          <p className="text-muted-foreground">Vous vous engagez à :</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Fournir des informations exactes et à les maintenir à jour</li>
            <li>Ne pas utiliser le service à des fins illicites</li>
            <li>
              Ne pas publier de contenus offensants, diffamatoires ou portant atteinte aux droits
              de tiers
            </li>
            <li>Respecter la vie privée de vos invités</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Tarification et commissions</h2>
          <p className="text-muted-foreground">
            L&apos;utilisation d&apos;Amora est gratuite pour la création et la gestion de votre
            site. Des frais de service de{" "}
            <strong className="text-foreground">2,9 % + 0,30 € HT</strong> sont prélevés sur
            chaque contribution reçue. Ces frais sont déduits du montant net reversé au couple.
            Les transactions sont traitées par Stripe et soumises à leurs propres conditions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            Les contenus que vous publiez sur votre site (photos, textes, informations) restent
            votre propriété. En les publiant sur Amora, vous accordez à Amora une licence
            non-exclusive et gratuite pour les héberger et les afficher dans le cadre du service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Responsabilité</h2>
          <p className="text-muted-foreground">
            Amora s&apos;engage à maintenir le service disponible dans la mesure du possible, mais
            ne garantit pas une disponibilité ininterrompue. Amora ne saurait être tenu responsable
            des dommages indirects résultant de l&apos;utilisation ou de l&apos;indisponibilité du
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Résiliation</h2>
          <p className="text-muted-foreground">
            Vous pouvez supprimer votre compte à tout moment en contactant{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
            . Amora se réserve le droit de suspendre ou résilier un compte en cas de violation des
            présentes CGU.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">10. Droit applicable</h2>
          <p className="text-muted-foreground">
            Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux
            tribunaux compétents du ressort de Paris.
          </p>
        </section>
      </div>
    </article>
  )
}

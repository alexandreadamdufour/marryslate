import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Amora",
  robots: { index: false },
}

const LAST_UPDATED = "25 juin 2026"

export default function CguPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Objet et champ d&apos;application</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès
            et l&apos;utilisation de la plateforme <strong className="text-foreground">Amora</strong>,
            éditée par ADAM AGENCY (Alexandre Dufour), accessible à l&apos;adresse amora.fr. Amora
            est un service permettant aux couples de créer un site de mariage personnalisé, de gérer
            une liste de cadeaux en ligne et de collecter des contributions financières de leurs
            invités.
          </p>
          <p className="mt-2 text-muted-foreground">
            Les CGU s&apos;appliquent à toute personne qui accède au service, qu&apos;il
            s&apos;agisse d&apos;un couple (utilisateur titulaire d&apos;un compte) ou
            d&apos;un invité visitant un site de mariage public.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Acceptation des CGU</h2>
          <p className="text-muted-foreground">
            La création d&apos;un compte ou l&apos;utilisation du service vaut acceptation pleine
            et entière des présentes CGU ainsi que de nos{" "}
            <a href="/cgv" className="underline underline-offset-4 hover:text-foreground">
              Conditions Générales de Vente
            </a>{" "}
            et de notre{" "}
            <a
              href="/confidentialite"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Politique de confidentialité
            </a>
            . Si vous n&apos;acceptez pas ces conditions, vous devez cesser d&apos;utiliser le
            service.
          </p>
          <p className="mt-2 text-muted-foreground">
            Amora se réserve le droit de modifier les présentes CGU. Les utilisateurs sont informés
            de toute modification substantielle par email. La poursuite de l&apos;utilisation du
            service après notification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Création et gestion du compte</h2>
          <p className="text-muted-foreground">
            L&apos;accès aux fonctionnalités du tableau de bord nécessite la création d&apos;un
            compte avec une adresse e-mail valide et un mot de passe sécurisé. L&apos;utilisateur
            s&apos;engage à :
          </p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            <li>— fournir des informations exactes, complètes et à les maintenir à jour ;</li>
            <li>— garder ses identifiants de connexion confidentiels ;</li>
            <li>
              — notifier immédiatement Amora de tout accès non autorisé à son compte à l&apos;adresse{" "}
              <a
                href="mailto:alexandre.a.dufour@gmail.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                alexandre.a.dufour@gmail.com
              </a>
              .
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Un seul compte est autorisé par mariage. Le compte doit correspondre à une véritable
            préparation de mariage. L&apos;utilisation du service à des fins commerciales ou de
            test en dehors de ce cadre est interdite.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Description du service</h2>
          <p className="mb-2 text-muted-foreground">
            Amora met à disposition des couples les fonctionnalités suivantes :
          </p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Site de mariage personnalisé</strong> — création
              d&apos;une page publique accessible via une URL unique (amora.fr/m/votre-slug),
              présentant les informations du mariage, le programme, les détails pratiques.
            </li>
            <li>
              <strong className="text-foreground">Liste de cadeaux</strong> — ajout de cadeaux avec
              titre, description, montant cible et photo, visibles par les invités.
            </li>
            <li>
              <strong className="text-foreground">Cagnotte en ligne</strong> — collecte de
              contributions financières par carte bancaire, traitées par Stripe.
            </li>
            <li>
              <strong className="text-foreground">Retrait des fonds</strong> — virement des fonds
              collectés (déduction faite des frais de service) sur le compte bancaire du couple,
              sous réserve de la vérification d&apos;identité (KYC) requise par Stripe.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            La création de compte et la gestion du site sont gratuites. Les frais de service
            s&apos;appliquent uniquement aux transactions reçues (voir{" "}
            <a href="/cgv" className="underline underline-offset-4 hover:text-foreground">
              CGV
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Obligations et responsabilités des utilisateurs</h2>
          <p className="mb-2 text-muted-foreground">
            En utilisant Amora, vous vous engagez à ne pas :
          </p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>— utiliser le service à des fins illicites ou contraires à l&apos;ordre public ;</li>
            <li>
              — publier des contenus offensants, diffamatoires, trompeurs, ou portant atteinte aux
              droits de tiers (droits d&apos;auteur, droit à l&apos;image) ;
            </li>
            <li>
              — collecter des contributions pour un événement fictif ou à des fins de fraude ;
            </li>
            <li>
              — tenter de contourner les mesures de sécurité ou d&apos;accéder à des données
              appartenant à d&apos;autres utilisateurs ;
            </li>
            <li>
              — utiliser des outils automatisés (robots, scrapers) pour accéder au service sans
              autorisation préalable.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Vous êtes seul responsable des contenus que vous publiez (textes, photos) et vous
            garantissez disposer de tous les droits nécessaires sur ces contenus. Amora ne peut
            être tenu responsable des contenus publiés par ses utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            Amora et ses composants (marque, interface, code source, design) sont la propriété
            exclusive d&apos;ADAM AGENCY et protégés par le droit de la propriété intellectuelle.
            Aucun droit d&apos;usage autre que celui strictement nécessaire à l&apos;utilisation du
            service n&apos;est accordé.
          </p>
          <p className="mt-2 text-muted-foreground">
            Les contenus que vous publiez sur votre site (photos de mariage, textes) restent votre
            propriété. En les publiant, vous accordez à Amora une licence non-exclusive, gratuite,
            mondiale, pour les héberger, afficher et reproduire dans le seul cadre de la fourniture
            du service. Cette licence prend fin à la suppression du contenu ou du compte.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Disponibilité du service</h2>
          <p className="text-muted-foreground">
            Amora s&apos;efforce de maintenir le service accessible 24h/24 et 7j/7. Toutefois, des
            interruptions peuvent survenir pour des opérations de maintenance ou pour des causes
            indépendantes de notre volonté (pannes des hébergeurs, force majeure). Amora ne
            garantit pas une disponibilité ininterrompue du service et ne saurait être tenu
            responsable de pertes ou dommages résultant d&apos;une indisponibilité temporaire.
          </p>
          <p className="mt-2 text-muted-foreground">
            Les maintenances planifiées sont annoncées par email avec un préavis raisonnable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Limitation de responsabilité</h2>
          <p className="text-muted-foreground">
            Amora agit en tant qu&apos;intermédiaire technique entre les couples et leurs invités.
            Amora ne garantit pas le montant des contributions qui seront reçues et n&apos;est pas
            responsable des comportements des invités utilisant la plateforme.
          </p>
          <p className="mt-2 text-muted-foreground">
            En cas de litige entre un couple et un invité au sujet d&apos;une contribution, Amora
            pourra faciliter la communication mais n&apos;est pas partie au litige. La
            responsabilité d&apos;Amora est limitée, dans tous les cas, au montant des frais de
            service versés par l&apos;utilisateur au cours des 12 mois précédant le litige.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Résiliation</h2>
          <p className="text-muted-foreground">
            Vous pouvez supprimer votre compte à tout moment en contactant{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
            . La suppression entraîne la désactivation immédiate du site public et la suppression
            des données de compte dans les délais prévus par notre politique de confidentialité.
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong className="text-foreground">Attention</strong> : la suppression du compte
            n&apos;est possible que si aucun solde n&apos;est en attente de retrait. Vous devez
            retirer les fonds disponibles avant de clôturer votre compte.
          </p>
          <p className="mt-2 text-muted-foreground">
            Amora se réserve le droit de suspendre ou résilier un compte sans préavis en cas de
            violation grave des présentes CGU (fraude, contenus illicites, tentative
            d&apos;intrusion). En cas de résiliation par Amora pour motif légitime, les fonds
            disponibles sont restitués au couple dans les meilleurs délais.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">10. Droit applicable et juridiction</h2>
          <p className="text-muted-foreground">
            Les présentes CGU sont soumises au droit français. En cas de litige, et après tentative
            de résolution amiable, les tribunaux du ressort de Paris sont seuls compétents.
          </p>
          <p className="mt-2 text-muted-foreground">
            Conformément à l&apos;article L.612-1 du Code de la consommation, tout consommateur
            dispose du droit de recourir gratuitement à un médiateur de la consommation. Les
            coordonnées du médiateur compétent sont disponibles sur demande à{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question relative aux présentes CGU :{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
          </p>
        </section>
      </div>
    </article>
  )
}

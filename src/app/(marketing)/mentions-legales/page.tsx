import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales — Amora",
  robots: { index: false },
}

export default function MentionsLegalesPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-10 text-4xl font-semibold tracking-tight">Mentions légales</h1>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Éditeur du site</h2>
          <p className="text-muted-foreground">
            Le site <strong className="text-foreground">Amora</strong> (amora.fr) est édité par :
          </p>
          <address className="mt-3 not-italic text-muted-foreground">
            <strong className="text-foreground">Alexandre Dufour</strong>
            <br />
            ADAM AGENCY
            <br />
            Issy-les-Moulineaux, France
            <br />
            Email :{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
          </address>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Directeur de la publication</h2>
          <p className="text-muted-foreground">
            Alexandre Dufour, en qualité de représentant d&apos;ADAM AGENCY.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Hébergement</h2>
          <p className="text-muted-foreground">
            L&apos;application est hébergée par :
          </p>
          <address className="mt-3 not-italic text-muted-foreground">
            <strong className="text-foreground">Vercel Inc.</strong>
            <br />
            340 Pine Street, Suite 701
            <br />
            San Francisco, CA 94104, États-Unis
            <br />
            Site web :{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              vercel.com
            </a>
          </address>
          <p className="mt-4 text-muted-foreground">
            Les données sont stockées par :
          </p>
          <address className="mt-3 not-italic text-muted-foreground">
            <strong className="text-foreground">Supabase Inc.</strong>
            <br />
            970 Toa Payoh North #07-04, Singapour 318992
            <br />
            Site web :{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              supabase.com
            </a>
          </address>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Traitement des paiements</h2>
          <p className="text-muted-foreground">
            Les paiements sont traités par{" "}
            <strong className="text-foreground">Stripe Payments Europe Limited</strong>, 1 Grand
            Canal Street Lower, Grand Canal Dock, Dublin D02 H210, Irlande. Stripe est agréé par
            la Banque Centrale d&apos;Irlande en tant qu&apos;établissement de monnaie électronique
            (numéro C187865). Amora ne stocke à aucun moment les données de carte bancaire de ses
            utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble des éléments constituant le site Amora (textes, graphismes, logotypes,
            icônes, interface) sont protégés par le Code de la propriété intellectuelle. Toute
            reproduction, représentation, modification ou diffusion, totale ou partielle, sans
            autorisation écrite préalable d&apos;ADAM AGENCY est strictement interdite et
            constituerait une contrefaçon.
          </p>
          <p className="mt-2 text-muted-foreground">
            Les contenus publiés par les utilisateurs (photos, textes) restent leur propriété
            exclusive.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Données personnelles et cookies</h2>
          <p className="text-muted-foreground">
            Ce site traite des données personnelles conformément au RGPD. Consultez notre{" "}
            <a
              href="/confidentialite"
              className="underline underline-offset-4 hover:text-foreground"
            >
              politique de confidentialité
            </a>{" "}
            pour connaître les données collectées, leurs finalités et vos droits. Seuls des cookies
            strictement nécessaires au fonctionnement du service sont utilisés.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Droit applicable</h2>
          <p className="text-muted-foreground">
            Le présent site est soumis au droit français. Tout litige relatif à son utilisation
            sera de la compétence des tribunaux du ressort de Paris.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question ou réclamation :{" "}
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

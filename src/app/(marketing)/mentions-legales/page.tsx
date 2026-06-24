import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
}

export default function MentionsLegalesPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-10 text-4xl">Mentions légales</h1>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Éditeur du site</h2>
          <p className="text-muted-foreground">
            Le site Amora est édité par une entreprise en cours d&apos;immatriculation.
            <br />
            Adresse : France
            <br />
            Email :{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Directeur de la publication</h2>
          <p className="text-muted-foreground">
            Le directeur de la publication est le représentant légal de la société éditrice d&apos;Amora.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Hébergement</h2>
          <p className="text-muted-foreground">
            L&apos;application est hébergée par :<br />
            <strong className="text-foreground">Vercel Inc.</strong> — 340 Pine Street, Suite 701,
            San Francisco, CA 94104, États-Unis<br /><br />
            Les données sont stockées par :<br />
            <strong className="text-foreground">Supabase Inc.</strong> — 970 Toa Payoh North #07-04,
            Singapour 318992
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Traitement des paiements</h2>
          <p className="text-muted-foreground">
            Les paiements sont traités par{" "}
            <strong className="text-foreground">Stripe Payments Europe Limited</strong> —
            1 Grand Canal Street Lower, Grand Canal Dock, Dublin D02 H210, Irlande.
            Stripe est agrée par la Banque Centrale d&apos;Irlande en tant
            qu&apos;établissement de monnaie électronique (numéro C187865).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Propriété intellectuelle</h2>
          <p className="text-muted-foreground">
            L&apos;ensemble des contenus présents sur ce site (textes, images, logos, interface
            graphique) sont protégés par le droit d&apos;auteur et la législation sur la
            propriété intellectuelle. Toute reproduction, représentation ou diffusion sans
            autorisation préalable et écrite de l&apos;éditeur est interdite.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Cookies et données personnelles</h2>
          <p className="text-muted-foreground">
            Ce site utilise des cookies strictement nécessaires à son fonctionnement. Consultez
            notre{" "}
            <a href="/confidentialite" className="underline underline-offset-4 hover:text-foreground">
              politique de confidentialité
            </a>{" "}
            pour en savoir plus.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question :{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
          </p>
        </section>
      </div>
    </article>
  )
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
}

const LAST_UPDATED = "24 juin 2026"

export default function ConfidentialitePage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-4xl">Politique de confidentialité</h1>
      <p className="mb-10 text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Responsable du traitement</h2>
          <p className="text-muted-foreground">
            Amora est responsable du traitement de vos données personnelles. Contact :{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Données collectées</h2>
          <p className="mb-2 text-muted-foreground">
            Selon votre usage, Amora peut collecter les données suivantes :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-muted-foreground">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Donnée</th>
                  <th className="py-2 pr-4 text-left font-semibold text-foreground">Finalité</th>
                  <th className="py-2 text-left font-semibold text-foreground">Base légale</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4">Email, prénom, nom</td>
                  <td className="py-2 pr-4">Création de compte et communication</td>
                  <td className="py-2">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Informations de mariage</td>
                  <td className="py-2 pr-4">Affichage du site public</td>
                  <td className="py-2">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Données de paiement</td>
                  <td className="py-2 pr-4">Traitement des transactions</td>
                  <td className="py-2">Exécution du contrat (via Stripe)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Logs de navigation</td>
                  <td className="py-2 pr-4">Sécurité et débogage</td>
                  <td className="py-2">Intérêt légitime</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Cookies</h2>
          <p className="text-muted-foreground">
            Amora utilise uniquement des cookies strictement nécessaires :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Cookie de session</strong> (Clerk) — maintien de
              votre connexion, durée de session
            </li>
            <li>
              <strong className="text-foreground">Cookie Stripe</strong> — sécurité des paiements,
              prévention de la fraude
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Ces cookies ne nécessitent pas votre consentement (art. 82 de la loi Informatique et
            Libertés). Aucun cookie de tracking ou publicitaire n&apos;est utilisé.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Partage des données</h2>
          <p className="text-muted-foreground">
            Amora ne vend jamais vos données. Elles sont partagées uniquement avec nos
            sous-traitants techniques :
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Clerk</strong> — authentification
            </li>
            <li>
              <strong className="text-foreground">Supabase</strong> — stockage des données
            </li>
            <li>
              <strong className="text-foreground">Stripe</strong> — traitement des paiements
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — envoi d&apos;emails
              transactionnels
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — hébergement de
              l&apos;application
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Tous ces prestataires sont soumis à des engagements de confidentialité conformes au RGPD.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Durée de conservation</h2>
          <p className="text-muted-foreground">
            Vos données sont conservées pendant la durée de votre compte, plus 3 ans après
            désactivation (obligations légales). Les données de paiement sont conservées 5 ans
            (obligations comptables). Les logs de connexion sont supprimés après 12 mois.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Vos droits</h2>
          <p className="mb-2 text-muted-foreground">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>Droit d&apos;accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement (&laquo;&thinsp;droit à l&apos;oubli&thinsp;&raquo;)</li>
            <li>Droit à la portabilité</li>
            <li>Droit d&apos;opposition</li>
            <li>Droit à la limitation du traitement</li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@amora.fr" className="underline underline-offset-4 hover:text-foreground">
              contact@amora.fr
            </a>
            . En cas de réclamation non résolue, vous pouvez saisir la CNIL (
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              cnil.fr
            </a>
            ).
          </p>
        </section>
      </div>
    </article>
  )
}

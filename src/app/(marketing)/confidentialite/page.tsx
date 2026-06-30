import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Marryslate",
  robots: { index: false },
}

const LAST_UPDATED = "25 juin 2026"

export default function ConfidentialitePage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Dernière mise à jour : {LAST_UPDATED}
      </p>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Responsable du traitement</h2>
          <p className="text-muted-foreground">
            Le responsable du traitement de vos données personnelles est{" "}
            <strong className="text-foreground">Alexandre Dufour — ADAM AGENCY</strong>,
            Issy-les-Moulineaux, France. Pour toute question relative à vos données :{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Données collectées</h2>
          <p className="mb-4 text-muted-foreground">
            Marryslate collecte uniquement les données nécessaires à la fourniture du service.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-muted-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Donnée
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Finalité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Base légale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3">Prénom, nom, adresse e-mail</td>
                  <td className="px-4 py-3">Création de compte, connexion, communications</td>
                  <td className="px-4 py-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Informations du mariage (date, lieu, prénoms)</td>
                  <td className="px-4 py-3">Affichage du site public, personnalisation</td>
                  <td className="px-4 py-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Données de paiement (carte bancaire, IBAN)</td>
                  <td className="px-4 py-3">
                    Traitement des contributions et virements bancaires
                  </td>
                  <td className="px-4 py-3">Exécution du contrat (via Stripe)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Messages et noms des invités contributeurs</td>
                  <td className="px-4 py-3">Affichage au couple, envoi des reçus</td>
                  <td className="px-4 py-3">Intérêt légitime / consentement</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Adresse IP, logs techniques</td>
                  <td className="px-4 py-3">Sécurité, prévention de la fraude, débogage</td>
                  <td className="px-4 py-3">Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Statistiques d&apos;utilisation (anonymisées)</td>
                  <td className="px-4 py-3">Amélioration du service via Google Analytics</td>
                  <td className="px-4 py-3">Consentement</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-muted-foreground">
            <strong className="text-foreground">Note importante :</strong> Marryslate ne stocke jamais
            les données de carte bancaire. Celles-ci sont saisies et conservées exclusivement par
            notre prestataire de paiement Stripe, certifié PCI-DSS niveau 1. De même, les
            coordonnées bancaires pour les virements (IBAN) sont traitées directement par Stripe
            Connect.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Cookies</h2>
          <p className="mb-2 text-muted-foreground">
            Marryslate utilise deux catégories de cookies :
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Cookies strictement nécessaires</strong> — session
              d&apos;authentification (Clerk) et sécurité des paiements (Stripe). Ces cookies ne
              nécessitent pas votre consentement (art. 82 de la loi Informatique et Libertés).
            </li>
            <li>
              <strong className="text-foreground">Cookies analytiques</strong> — Google Analytics 4
              pour comprendre l&apos;utilisation du service (données anonymisées, IP tronquée). Ces
              cookies sont soumis à votre consentement.
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            Aucun cookie publicitaire ou de reciblage n&apos;est utilisé.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Sous-traitants et destinataires</h2>
          <p className="mb-3 text-muted-foreground">
            Marryslate ne vend ni ne loue vos données. Elles sont partagées uniquement avec les
            prestataires techniques suivants, liés par des accords de traitement conformes au RGPD :
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-muted-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Prestataire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Rôle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Localisation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Clerk</td>
                  <td className="px-4 py-3">Authentification et gestion de comptes</td>
                  <td className="px-4 py-3">États-Unis (clauses contractuelles types)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Supabase</td>
                  <td className="px-4 py-3">Base de données (région EU)</td>
                  <td className="px-4 py-3">Union européenne</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Stripe</td>
                  <td className="px-4 py-3">Paiements, virements, KYC</td>
                  <td className="px-4 py-3">Irlande (UE)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Resend</td>
                  <td className="px-4 py-3">Emails transactionnels</td>
                  <td className="px-4 py-3">États-Unis (clauses contractuelles types)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Vercel</td>
                  <td className="px-4 py-3">Hébergement de l&apos;application</td>
                  <td className="px-4 py-3">États-Unis (clauses contractuelles types)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Google Analytics</td>
                  <td className="px-4 py-3">Statistiques de visite (anonymisées)</td>
                  <td className="px-4 py-3">États-Unis (clauses contractuelles types)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Durée de conservation</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Données de compte</strong> — conservées pendant
              toute la durée d&apos;activité du compte, puis 3 ans après désactivation (délai de
              prescription de droit commun, art. 2224 du Code civil).
            </li>
            <li>
              <strong className="text-foreground">Données financières et transactions</strong> —
              conservées 10 ans à compter de la transaction (obligation légale comptable, art.
              L.123-22 du Code de commerce).
            </li>
            <li>
              <strong className="text-foreground">Logs techniques et adresses IP</strong> — supprimés
              après 12 mois.
            </li>
            <li>
              <strong className="text-foreground">Données des invités (contributions)</strong> —
              conservées le temps du compte du couple, puis anonymisées.
            </li>
            <li>
              <strong className="text-foreground">Données analytiques</strong> — anonymisées sous
              26 mois (paramétrage Google Analytics).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Vos droits (RGPD)</h2>
          <p className="mb-3 text-muted-foreground">
            Conformément au Règlement Général sur la Protection des Données (RGPD, UE 2016/679)
            et à la loi Informatique et Libertés, vous disposez des droits suivants :
          </p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Droit d&apos;accès</strong> — obtenir une copie
              des données vous concernant.
            </li>
            <li>
              <strong className="text-foreground">Droit de rectification</strong> — corriger des
              données inexactes ou incomplètes.
            </li>
            <li>
              <strong className="text-foreground">Droit à l&apos;effacement</strong> — demander la
              suppression de vos données (sous réserve des obligations légales de conservation).
            </li>
            <li>
              <strong className="text-foreground">Droit à la portabilité</strong> — recevoir vos
              données dans un format structuré et lisible par machine.
            </li>
            <li>
              <strong className="text-foreground">Droit d&apos;opposition</strong> — vous opposer
              au traitement fondé sur notre intérêt légitime.
            </li>
            <li>
              <strong className="text-foreground">Droit à la limitation</strong> — restreindre le
              traitement de vos données dans certains cas.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Pour exercer ces droits, envoyez votre demande par email à{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>
            . Nous nous engageons à y répondre dans un délai d&apos;un mois. En cas de réponse
            insatisfaisante, vous pouvez introduire une réclamation auprès de la{" "}
            <strong className="text-foreground">CNIL</strong> (Commission Nationale de
            l&apos;Informatique et des Libertés) :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              cnil.fr
            </a>{" "}
            — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — Tél. : 01 53 73 22 22.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Sécurité</h2>
          <p className="text-muted-foreground">
            Marryslate met en œuvre des mesures techniques et organisationnelles appropriées pour
            protéger vos données contre tout accès non autorisé, perte ou divulgation : chiffrement
            des communications (HTTPS/TLS), accès à la base de données restreint par des règles de
            sécurité au niveau des lignes (Row Level Security), authentification à deux facteurs
            disponible, et paiements traités par Stripe (certifié PCI-DSS niveau 1).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Modifications</h2>
          <p className="text-muted-foreground">
            Marryslate se réserve le droit de modifier la présente politique à tout moment. Toute
            modification substantielle vous sera notifiée par email et la date de mise à jour sera
            actualisée en en-tête de ce document.
          </p>
        </section>
      </div>
    </article>
  )
}

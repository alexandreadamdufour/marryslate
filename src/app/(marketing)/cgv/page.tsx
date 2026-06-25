import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions générales de vente — Amora",
  robots: { index: false },
}

const LAST_UPDATED = "25 juin 2026"

export default function CgvPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 text-4xl font-semibold tracking-tight">
        Conditions générales de vente
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>

      <div className="space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Vendeur</h2>
          <p className="text-muted-foreground">
            Le service Amora est fourni par :
          </p>
          <address className="mt-3 not-italic text-muted-foreground">
            <strong className="text-foreground">Alexandre Dufour — ADAM AGENCY</strong>
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
          <h2 className="mb-3 text-lg font-semibold">2. Objet</h2>
          <p className="text-muted-foreground">
            Les présentes Conditions Générales de Vente (« CGV ») définissent les conditions
            financières dans lesquelles Amora fournit son service aux couples (les « clients »).
            Elles complètent les{" "}
            <a href="/cgu" className="underline underline-offset-4 hover:text-foreground">
              Conditions Générales d&apos;Utilisation
            </a>
            . En utilisant les fonctionnalités de collecte de fonds d&apos;Amora, le client accepte
            les présentes CGV sans réserve.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Tarification — pas d&apos;abonnement</h2>
          <p className="text-muted-foreground">
            Amora ne pratique <strong className="text-foreground">aucun abonnement mensuel ou annuel</strong>.
            La création d&apos;un compte, la personnalisation du site de mariage et la gestion de la
            liste de cadeaux sont entièrement gratuites.
          </p>
          <p className="mt-2 text-muted-foreground">
            Amora ne perçoit une rémunération qu&apos;à l&apos;occasion de chaque contribution
            financière reçue par un couple (modèle « pay-as-you-go »). Aucun frais n&apos;est
            prélevé si aucune contribution n&apos;est encaissée.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Frais de service</h2>
          <p className="mb-4 text-muted-foreground">
            Pour chaque contribution reçue avec succès, des frais de service sont prélevés
            automatiquement avant reversement au couple :
          </p>

          <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-3xl font-semibold tracking-tight">2,9 % + 0,30 €</p>
            <p className="mt-1 text-muted-foreground">par transaction reçue</p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-muted-foreground">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Contribution brute
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Frais Amora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                    Montant net reversé
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3">20,00 €</td>
                  <td className="px-4 py-3 text-muted-foreground">0,88 €</td>
                  <td className="px-4 py-3 font-medium text-foreground">19,12 €</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">50,00 €</td>
                  <td className="px-4 py-3 text-muted-foreground">1,75 €</td>
                  <td className="px-4 py-3 font-medium text-foreground">48,25 €</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">100,00 €</td>
                  <td className="px-4 py-3 text-muted-foreground">3,20 €</td>
                  <td className="px-4 py-3 font-medium text-foreground">96,80 €</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">200,00 €</td>
                  <td className="px-4 py-3 text-muted-foreground">6,10 €</td>
                  <td className="px-4 py-3 font-medium text-foreground">193,90 €</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-muted-foreground">
            Les frais sont déduits du montant versé par l&apos;invité. Il n&apos;y a aucun frais
            supplémentaire pour les retraits ou les virements bancaires.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Processus de paiement</h2>
          <p className="text-muted-foreground">
            Les paiements sont traités par{" "}
            <strong className="text-foreground">Stripe Payments Europe Limited</strong> (agrément
            Banque Centrale d&apos;Irlande n° C187865). Stripe collecte le paiement de
            l&apos;invité, déduit les frais de service, et verse le montant net sur le compte Stripe
            Connect du couple.
          </p>
          <p className="mt-2 text-muted-foreground">
            Pour recevoir des virements, les couples doivent compléter le processus de vérification
            d&apos;identité (KYC — Know Your Customer) imposé par la réglementation européenne sur
            les services de paiement (DSP2). Ce processus est réalisé directement via Stripe et
            implique la fourniture d&apos;une pièce d&apos;identité valide.
          </p>
          <p className="mt-2 text-muted-foreground">
            Les fonds collectés sont disponibles pour retrait dès la validation du paiement
            (généralement sous 2 à 5 jours ouvrés). Le délai de virement sur le compte bancaire
            du couple est généralement de 2 jours ouvrés à compter de la demande de retrait.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Remboursements</h2>
          <p className="mb-2 text-muted-foreground">
            En raison de la nature du service (collecte de cadeaux de mariage, service numérique
            immédiatement consommé), les conditions de remboursement suivantes s&apos;appliquent :
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Contributions des invités</strong> — une
              contribution est définitive une fois le paiement validé. Les invités ne peuvent pas
              demander de remboursement directement à Amora. Tout différend entre un invité et un
              couple doit être réglé entre les parties. En cas de litige avéré (fraude,
              impersonation), Amora peut initier un remboursement via Stripe sur présentation de
              justificatifs.
            </li>
            <li>
              <strong className="text-foreground">Frais de service</strong> — les frais de service
              prélevés sur les contributions ne sont pas remboursables, y compris en cas de
              remboursement d&apos;une contribution à un invité. Les frais de transaction Stripe
              sont perdus et ne sont pas récupérables.
            </li>
            <li>
              <strong className="text-foreground">Erreur technique</strong> — si une contribution a
              été débitée sans que les fonds soient crédités au couple en raison d&apos;une erreur
              technique d&apos;Amora, un remboursement intégral sera effectué dans les meilleurs
              délais.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Pour tout remboursement ou litige, contactez-nous à{" "}
            <a
              href="mailto:alexandre.a.dufour@gmail.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              alexandre.a.dufour@gmail.com
            </a>{" "}
            en précisant le numéro de transaction concerné.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Droit de rétractation</h2>
          <p className="text-muted-foreground">
            Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de
            rétractation de 14 jours ne s&apos;applique pas aux contenus numériques fournis
            immédiatement et aux prestations de services pleinement exécutées avant la fin du délai
            de rétractation, dès lors que l&apos;utilisateur a expressément renoncé à ce droit.
          </p>
          <p className="mt-2 text-muted-foreground">
            En initiant une transaction sur Amora, l&apos;invité reconnaît expressément que le
            service de paiement est immédiatement exécuté et renonce à son droit de rétractation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Fiscalité</h2>
          <p className="text-muted-foreground">
            Les sommes collectées via Amora constituent, pour les bénéficiaires (les couples), des
            dons de particuliers. En France, les dons entre particuliers peuvent être soumis à des
            droits de donation au-delà de certains seuils légaux. Amora n&apos;est pas responsable
            des obligations fiscales de ses utilisateurs et recommande de se rapprocher d&apos;un
            conseiller fiscal pour toute question à ce sujet.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Droit applicable</h2>
          <p className="text-muted-foreground">
            Les présentes CGV sont soumises au droit français. En cas de litige non résolu
            amiablement, les tribunaux du ressort de Paris sont compétents, sans préjudice du
            recours à la médiation de la consommation (art. L.612-1 et suivants du Code de la
            consommation).
          </p>
        </section>
      </div>
    </article>
  )
}

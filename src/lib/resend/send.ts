import { resend, FROM_EMAIL } from "./client"

interface ContributionReceiptParams {
  guestEmail: string
  guestName: string
  giftTitle: string | null
  grossAmount: number
  weddingPartner1: string
  weddingPartner2: string
  weddingSlug: string
}

export async function sendContributionReceipt(p: ContributionReceiptParams) {
  const subject = `Merci pour votre contribution au mariage de ${p.weddingPartner1} & ${p.weddingPartner2}`
  const giftLine = p.giftTitle ? `pour <strong>${p.giftTitle}</strong>` : "comme contribution libre"

  await resend.emails.send({
    from: FROM_EMAIL,
    to: p.guestEmail,
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 28px; margin-bottom: 8px;">Merci, ${p.guestName} 🎁</h1>
        <p style="color: #666; margin-bottom: 24px;">
          Votre contribution de <strong>${(p.grossAmount / 100).toFixed(2).replace(".", ",")} €</strong>
          ${giftLine} au mariage de
          <strong>${p.weddingPartner1} &amp; ${p.weddingPartner2}</strong> a bien été reçue.
        </p>
        <p style="color: #666;">
          Elle sera reversée directement au couple. Merci pour votre générosité !
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">
          Amora — Liste de mariage &amp; cagnotte en ligne.<br/>
          Ce reçu ne vaut pas facture. Paiement sécurisé par Stripe.
        </p>
      </div>
    `,
  })
}

interface CoupleContributionNotifParams {
  coupleEmail: string
  guestName: string
  giftTitle: string | null
  netAmount: number
  grossAmount: number
  weddingPartner1: string
  weddingPartner2: string
}

export async function sendCoupleContributionNotif(p: CoupleContributionNotifParams) {
  const giftLine = p.giftTitle ? `pour <strong>${p.giftTitle}</strong>` : "comme contribution libre"

  await resend.emails.send({
    from: FROM_EMAIL,
    to: p.coupleEmail,
    subject: `Nouvelle contribution de ${p.guestName} — ${(p.netAmount / 100).toFixed(2).replace(".", ",")} €`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Bonne nouvelle ! 🎉</h1>
        <p style="color: #666; margin-bottom: 16px;">
          <strong>${p.guestName}</strong> vient de contribuer
          <strong>${(p.grossAmount / 100).toFixed(2).replace(".", ",")} €</strong>
          ${giftLine}.
        </p>
        <p style="color: #666;">
          Vous recevrez <strong>${(p.netAmount / 100).toFixed(2).replace(".", ",")} €</strong>
          net (après commission Amora) sur votre compte lors du prochain retrait.
        </p>
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contributions"
             style="display: inline-block; background: #7c3a28; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">
            Voir mes contributions
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Amora — Liste de mariage &amp; cagnotte en ligne.</p>
      </div>
    `,
  })
}

interface RsvpConfirmationParams {
  guestEmail: string
  guestName: string
  attending: boolean
  guestCount: number
  weddingPartner1: string
  weddingPartner2: string
  weddingSlug: string
}

export async function sendRsvpConfirmationToGuest(p: RsvpConfirmationParams) {
  const couple = `${p.weddingPartner1} &amp; ${p.weddingPartner2}`
  const subject = p.attending
    ? `Votre présence au mariage de ${p.weddingPartner1} & ${p.weddingPartner2} est confirmée`
    : `Votre réponse au mariage de ${p.weddingPartner1} & ${p.weddingPartner2}`

  const body = p.attending
    ? `
      <p style="color: #666;">
        Vous serez <strong>${p.guestCount} personne${p.guestCount > 1 ? "s" : ""}</strong>
        à célébrer avec ${couple}. On vous attend avec impatience !
      </p>
      <p style="margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/m/${p.weddingSlug}"
           style="display: inline-block; background: #7c3a28; color: white; padding: 12px 24px;
                  border-radius: 6px; text-decoration: none; font-size: 14px;">
          Voir le site du mariage
        </a>
      </p>`
    : `<p style="color: #666;">Votre absence a bien été notée. Merci d'avoir répondu.</p>`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: p.guestEmail,
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          ${p.attending ? "À bientôt, " : ""}${p.guestName} ${p.attending ? "🥂" : ""}
        </h1>
        ${body}
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">
          Amora — Confirmation RSVP pour le mariage de ${couple}.
        </p>
      </div>
    `,
  })
}

interface RsvpCoupleNotifParams {
  coupleEmail: string
  guestName: string
  attending: boolean
  guestCount: number
  dietary: string | null
  weddingPartner1: string
  weddingPartner2: string
}

export async function sendRsvpNotifToCouple(p: RsvpCoupleNotifParams) {
  const statusLine = p.attending
    ? `<strong>${p.guestName}</strong> sera présent·e —
       <strong>${p.guestCount} personne${p.guestCount > 1 ? "s" : ""}</strong>.`
    : `<strong>${p.guestName}</strong> ne pourra pas être là.`

  await resend.emails.send({
    from: FROM_EMAIL,
    to: p.coupleEmail,
    subject: `Nouvelle réponse RSVP de ${p.guestName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          Nouvelle réponse RSVP ${p.attending ? "✓" : "✗"}
        </h1>
        <p style="color: #666; margin-bottom: 16px;">${statusLine}</p>
        ${p.dietary ? `<p style="color: #666;">Régime alimentaire : <strong>${p.dietary}</strong></p>` : ""}
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invites"
             style="display: inline-block; background: #7c3a28; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-size: 14px;">
            Voir toutes les réponses
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Amora — Liste de mariage &amp; cagnotte en ligne.</p>
      </div>
    `,
  })
}

interface PayoutNotifParams {
  coupleEmail: string
  amountCentimes: number
  weddingPartner1: string
  weddingPartner2: string
}

export async function sendPayoutNotif(p: PayoutNotifParams) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: p.coupleEmail,
    subject: `Votre retrait de ${(p.amountCentimes / 100).toFixed(2).replace(".", ",")} € est en cours`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Retrait initié ✓</h1>
        <p style="color: #666;">
          Un virement de <strong>${(p.amountCentimes / 100).toFixed(2).replace(".", ",")} €</strong>
          est en cours vers votre compte bancaire enregistré.
          Il apparaîtra sous 1 à 3 jours ouvrés.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">Amora — Liste de mariage &amp; cagnotte en ligne.</p>
      </div>
    `,
  })
}

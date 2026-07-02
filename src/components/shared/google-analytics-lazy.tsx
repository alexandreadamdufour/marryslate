"use client"

import Script from "next/script"

interface Props {
  gaId: string
}

// Remplace <GoogleAnalytics> (@next/third-parties/google) : ce composant
// hardcode next/script en afterInteractive, aucune prop pour changer la
// stratégie. Réplique le même bootstrap (window.dataLayer + gtag() + gtag('js', ...)
// + gtag('config', gaId)) mais en lazyOnload — voir @/lib/ga-client-event
// pour l'équivalent local de sendGAEvent, requis en parallèle.
export function GoogleAnalyticsLazy({ gaId }: Props) {
  return (
    <>
      <Script id="ga-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
      <Script
        id="ga-loader"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
    </>
  )
}

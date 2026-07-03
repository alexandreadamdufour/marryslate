import type { Metadata } from "next"
import {
  Inter,
  Playfair_Display,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
  Lora,
} from "next/font/google"
import localFont from "next/font/local"
import { Toaster } from "sonner"
import { CookieBanner } from "@/components/shared/cookie-banner"
import { CrispChat } from "@/components/crisp-chat"
import { GoogleAnalyticsLazy } from "@/components/shared/google-analytics-lazy"
import { GoogleAnalyticsPageview } from "@/components/shared/google-analytics-pageview"
import { GoogleAdsConfig } from "@/components/shared/google-ads-config"
import { MetaPixel } from "@/components/shared/meta-pixel"
import { env } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
// Self-hosted (next/font/local) plutôt que next/font/google : évite la
// requête réseau vers fonts.gstatic.com au chargement, sert le WOFF2 depuis
// le même domaine. Fichiers dans src/fonts/, récupérés depuis la CSS2 API
// Google Fonts (2 requêtes séparées par poids — une requête combinée
// wght@400;600 renvoyait la même URL pour les deux poids, bug silencieux
// évité en vérifiant avant de committer).
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/fraunces-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
})
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
})
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-greatvibes",
  display: "swap",
})
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })

const APP_URL = env.NEXT_PUBLIC_APP_URL
const DEFAULT_DESCRIPTION =
  "Créez votre liste de mariage et votre site personnalisé. Simple, élégant, mobile-first."

export const metadata: Metadata = {
  title: {
    default: "Marryslate — Liste de mariage & cagnotte en ligne",
    template: "%s | Marryslate",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: "Marryslate",
    locale: "fr_FR",
    title: "Marryslate — Liste de mariage & cagnotte en ligne",
    description: DEFAULT_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Marryslate — Liste de mariage & cagnotte en ligne",
    description: DEFAULT_DESCRIPTION,
  },
  alternates: {
    canonical: APP_URL,
  },
  // Hardcodé volontairement : tags publics de vérification GSC, non sensibles.
  // Migration vers env non nécessaire, éviterait juste un round-trip Vercel pour zéro gain sécurité.
  // Deux propriétés GSC distinctes (domain + URL-prefix) → deux tags.
  verification: {
    google: [
      "TXAJfXY2wm227MhZfAWaA3MXznxr2rIj73A-0g17Q5o",
      "NT8pKOAcxWNF6C3OryDWcgconNuuIQJdNooobSWVPEw",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#ffffff",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${playfair.variable} ${cormorant.variable} ${greatVibes.variable} ${montserrat.variable} ${lora.variable}`}
    >
      <body>
        {children}
        <Toaster richColors position="bottom-right" toastOptions={{ duration: 5000 }} />
        <CookieBanner />
        <CrispChat />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <GoogleAnalyticsLazy gaId={process.env.NEXT_PUBLIC_GA_ID} />
            <GoogleAnalyticsPageview />
            {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && (
              <GoogleAdsConfig adsId={process.env.NEXT_PUBLIC_GOOGLE_ADS_ID} />
            )}
          </>
        )}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        )}
      </body>
    </html>
  )
}

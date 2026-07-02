import type { Metadata } from "next"
import {
  Fraunces,
  Inter,
  Playfair_Display,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
  Lora,
} from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { GoogleAnalytics } from "@next/third-parties/google"
import { CookieBanner } from "@/components/shared/cookie-banner"
import { CrispChat } from "@/components/crisp-chat"
import { GoogleAnalyticsPageview } from "@/components/shared/google-analytics-pageview"
import { GoogleAdsConfig } from "@/components/shared/google-ads-config"
import { MetaPixel } from "@/components/shared/meta-pixel"
import { env } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" })
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-cormorant", display: "swap" })
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-greatvibes", display: "swap" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" })
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
  // Hardcodé volontairement : tag public de vérification GSC, non sensible.
  // Migration vers env non nécessaire, éviterait juste un round-trip Vercel pour zéro gain sécurité.
  verification: {
    google: "TXAJfXY2wm227MhZfAWaA3MXznxr2rIj73A-0g17Q5o",
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
    <ClerkProvider>
      <html lang="fr" className={`${inter.variable} ${fraunces.variable} ${playfair.variable} ${cormorant.variable} ${greatVibes.variable} ${montserrat.variable} ${lora.variable}`}>
        <body>
          {children}
          <Toaster richColors position="bottom-right" toastOptions={{ duration: 5000 }} />
          <CookieBanner />
          <CrispChat />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
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
    </ClerkProvider>
  )
}

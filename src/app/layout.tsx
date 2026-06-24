import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { GoogleAnalytics } from "@next/third-parties/google"
import { CookieBanner } from "@/components/shared/cookie-banner"
import { CrispChat } from "@/components/crisp-chat"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const DEFAULT_DESCRIPTION =
  "Créez votre liste de mariage et votre site personnalisé. Simple, élégant, mobile-first."

export const metadata: Metadata = {
  title: {
    default: "Amora — Liste de mariage & cagnotte en ligne",
    template: "%s | Amora",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: "Amora",
    locale: "fr_FR",
    title: "Amora — Liste de mariage & cagnotte en ligne",
    description: DEFAULT_DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Amora — Liste de mariage & cagnotte en ligne",
    description: DEFAULT_DESCRIPTION,
  },
  alternates: {
    canonical: APP_URL,
  },
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
      <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
        <body>
          {children}
          <Toaster richColors position="top-right" />
          <CookieBanner />
          <CrispChat />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </body>
      </html>
    </ClerkProvider>
  )
}

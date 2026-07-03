import {
  Playfair_Display,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
  Lora,
} from "next/font/google"

// Polices de thème du site de mariage (choix du couple, cf. WEDDING_FONTS dans
// constants.ts). Utilisées par (dashboard) — aperçu du sélecteur de police —
// et par (public-wedding) — rendu du site public. Volontairement absentes du
// layout racine : elles ne servent ni à la homepage ni au reste du dashboard,
// et leur préchargement global y ralentissait le LCP mobile.
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

export const WEDDING_THEME_FONT_VARIABLES = `${playfair.variable} ${cormorant.variable} ${greatVibes.variable} ${montserrat.variable} ${lora.variable}`

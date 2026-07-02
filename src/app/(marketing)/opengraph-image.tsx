import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Mêmes règles Satori que /m/[slug]/opengraph-image.tsx (bugs réels trouvés
// en testant ce fichier-là) : fontFamily explicite sur chaque noeud texte,
// jamais de valeur undefined explicite dans un style, structure plate.
const FRAUNCES_TTF_URL =
  "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyjDg.ttf"
const FRAUNCES: React.CSSProperties = { fontFamily: "Fraunces" }

export default async function Image() {
  const fontData = await fetch(FRAUNCES_TTF_URL).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          background: "linear-gradient(135deg, hsl(36, 33%, 97%), hsl(36, 30%, 90%))",
        }}
      >
        <div style={{ ...FRAUNCES, fontSize: 96, fontWeight: 600, color: "hsl(16, 45%, 30%)" }}>
          Marryslate
        </div>
        <div style={{ ...FRAUNCES, fontSize: 32, color: "hsl(16, 45%, 45%)", textAlign: "center" }}>
          Site de mariage, cagnotte et gestion des invités
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fontData, style: "normal", weight: 600 }],
    }
  )
}

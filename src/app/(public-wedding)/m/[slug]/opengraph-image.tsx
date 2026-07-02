import { ImageResponse } from "next/og"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getWeddingBySlug } from "@/queries/wedding"

export const runtime = "nodejs" // Buffer utilisé dans toDataUri, indisponible/instable en edge
export const revalidate = 86400 // 24h
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// ImageResponse tourne sur Satori, pas le DOM — next/font/google (hook CSS)
// ne s'y applique pas. On fetch le TTF brut, mis en cache par revalidate
// (pas un fetch par requête).
const FRAUNCES_TTF_URL =
  "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyjDg.ttf"

// Satori requiert une fontFamily explicite sur CHAQUE noeud texte quand un
// seul font custom est enregistré (pas de fallback système fiable) — un
// noeud sans fontFamily fait planter le rendu en aval (repro : erreur opaque
// "Cannot read properties of undefined (reading 'toString')" au streaming de
// la réponse, isolé par bisection avant ce fix).
const FRAUNCES: React.CSSProperties = { fontFamily: "Fraunces" }

async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const wedding = await getWeddingBySlug(slug)

  const [fontData, coverImageDataUri] = await Promise.all([
    fetch(FRAUNCES_TTF_URL).then((res) => res.arrayBuffer()),
    wedding?.cover_image_url ? toDataUri(wedding.cover_image_url) : Promise.resolve(null),
  ])

  const partner1 = wedding?.partner1_first_name ?? ""
  const partner2 = wedding?.partner2_first_name ?? ""
  const dateLabel = wedding?.wedding_date
    ? format(new Date(wedding.wedding_date), "d MMMM yyyy", { locale: fr })
    : null
  const textColor = coverImageDataUri ? "#ffffff" : "hsl(16, 45%, 30%)"
  const mutedTextColor = coverImageDataUri ? "#ffffff" : "hsl(16, 45%, 40%)"
  const brandColor = coverImageDataUri ? "#ffffff" : "hsl(16, 45%, 45%)"

  // Structure plate volontaire : <img> en flux normal (pas position:absolute)
  // + un seul calque absolute (overlay + texte) par-dessus. Nesting un
  // position:absolute dans un parent flex centré cassait le layout de
  // l'image (rognée à ~50% de la largeur, sans erreur) — repro isolée en
  // testant chaque variante avant ce fix.
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          ...(coverImageDataUri
            ? {}
            : { background: "linear-gradient(135deg, hsl(36, 33%, 97%), hsl(36, 30%, 90%))" }),
        }}
      >
        {coverImageDataUri && (
          <img
            src={coverImageDataUri}
            alt=""
            width={1200}
            height={630}
            style={{ objectFit: "cover" }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            ...(coverImageDataUri ? { background: "rgba(0, 0, 0, 0.3)" } : {}),
          }}
        >
          <div
            style={{
              ...FRAUNCES,
              fontSize: 72,
              fontWeight: 600,
              color: textColor,
              textAlign: "center",
            }}
          >
            {partner1 && partner2 ? `${partner1} & ${partner2}` : "Marryslate"}
          </div>
          {dateLabel && (
            <div style={{ ...FRAUNCES, fontSize: 32, color: mutedTextColor }}>{dateLabel}</div>
          )}
          <div
            style={{
              ...FRAUNCES,
              position: "absolute",
              bottom: 40,
              fontSize: 28,
              color: brandColor,
            }}
          >
            Marryslate
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fontData, style: "normal", weight: 600 }],
    }
  )
}

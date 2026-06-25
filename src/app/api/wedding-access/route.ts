import { NextResponse } from "next/server"
import { getWeddingBySlug } from "@/queries/wedding"
import { validateAccessCodeSchema } from "@/lib/validators/access-code"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
  }

  const parsed = validateAccessCodeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 })
  }

  const { slug, code } = parsed.data

  const wedding = await getWeddingBySlug(slug)
  if (!wedding) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  if (!wedding.access_code_enabled || !wedding.access_code) {
    return NextResponse.json({ error: "NOT_PROTECTED" }, { status: 400 })
  }

  if (wedding.access_code !== code) {
    // Slow down brute-force attempts — 1s artificial delay on every wrong code
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return NextResponse.json({ error: "INVALID_CODE" }, { status: 403 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(`amora_access_${slug}`, code, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: `/m/${slug}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}

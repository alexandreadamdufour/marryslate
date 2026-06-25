import { NextResponse } from "next/server"
import { getWeddingBySlug } from "@/queries/wedding"
import { getTimelineSteps } from "@/queries/timeline"
import type { PracticalInfo } from "@/lib/validators/practical-info"
import {
  parseStepDateTime,
  buildIcsFile,
  type CalendarEventParams,
} from "@/lib/calendar"

interface Params {
  params: Promise<{ weddingSlug: string; filename: string }>
}

export async function GET(_req: Request, { params }: Params) {
  const { weddingSlug, filename } = await params

  // Strip .ics extension — handles "all.ics" or "<uuid>.ics"
  const id = filename.replace(/\.ics$/, "")

  const wedding = await getWeddingBySlug(weddingSlug)
  if (!wedding) return new NextResponse(null, { status: 404 })

  const steps = await getTimelineSteps(wedding.id)
  if (steps.length === 0) return new NextResponse(null, { status: 404 })

  const practicalInfo = wedding.practical_info as PracticalInfo | null
  const location =
    practicalInfo?.venue_ceremony?.name || practicalInfo?.venue_ceremony?.address
      ? [practicalInfo.venue_ceremony.name, practicalInfo.venue_ceremony.address]
          .filter(Boolean)
          .join(", ")
      : undefined

  const targetSteps = id === "all" ? steps : steps.filter((s) => s.id === id)
  if (targetSteps.length === 0) return new NextResponse(null, { status: 404 })

  const calName = `Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`

  const events: CalendarEventParams[] = targetSteps.flatMap((step) => {
    const dt = parseStepDateTime(wedding.wedding_date, step.time)
    if (!dt) return []
    return [
      {
        uid: `amora-${weddingSlug}-${step.id}@amora.fr`,
        title: step.emoji ? `${step.emoji} ${step.title}` : step.title,
        description: step.description ?? undefined,
        location,
        startIso: dt.start,
        endIso: dt.end,
      },
    ]
  })

  if (events.length === 0) {
    return new NextResponse("Date du mariage non renseignée", { status: 422 })
  }

  const ics = buildIcsFile(events, calName)

  const singleStep = id !== "all" ? targetSteps[0] : null
  const downloadName =
    id === "all"
      ? `mariage-${weddingSlug}.ics`
      : `${(singleStep?.title ?? id).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}.ics`

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "no-store",
    },
  })
}

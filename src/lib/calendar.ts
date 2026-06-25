export interface CalendarEventParams {
  uid: string
  title: string
  description?: string
  location?: string
  startIso: string // "YYYYMMDDTHHMMSS" local time (no Z)
  endIso: string
}

/**
 * Parse a wedding date + step time string into ICS-format start/end strings.
 * Supports formats: "14:00", "14h00", "9h30", "14:00:00"
 * Default duration: 1 hour.
 */
export function parseStepDateTime(
  weddingDate: string | null,
  stepTime: string
): { start: string; end: string } | null {
  if (!weddingDate) return null

  const match = stepTime.match(/^(\d{1,2})[h:](\d{2})/)
  if (!match || !match[1] || !match[2]) return null

  const hh = match[1].padStart(2, "0")
  const mm = match[2]
  const dateStr = weddingDate.replace(/-/g, "")

  const start = `${dateStr}T${hh}${mm}00`

  const endHour = (parseInt(hh) + 1) % 24
  const end = `${dateStr}T${String(endHour).padStart(2, "0")}${mm}00`

  return { start, end }
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let i = 75
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join("\r\n")
}

export function buildIcsEvent(params: CalendarEventParams): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTART:${params.startIso}`,
    `DTEND:${params.endIso}`,
    `SUMMARY:${escapeIcs(params.title)}`,
  ]
  if (params.description) lines.push(`DESCRIPTION:${escapeIcs(params.description)}`)
  if (params.location) lines.push(`LOCATION:${escapeIcs(params.location)}`)
  lines.push("END:VEVENT")
  return lines.map(foldIcsLine).join("\r\n")
}

export function buildIcsFile(events: CalendarEventParams[], calName: string): string {
  const parts = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amora//Wedding Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
    ...events.map(buildIcsEvent),
    "END:VCALENDAR",
  ]
  return parts.join("\r\n")
}

// Convert "YYYYMMDDTHHMMSS" → "YYYY-MM-DDTHH:MM:SS" for Outlook
function isoToRfc(s: string): string {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}`
}

export function googleCalendarUrl(params: CalendarEventParams): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${params.startIso}/${params.endIso}`,
  })
  if (params.description) p.set("details", params.description)
  if (params.location) p.set("location", params.location)
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function outlookCalendarUrl(params: CalendarEventParams): string {
  const p = new URLSearchParams({
    subject: params.title,
    startdt: isoToRfc(params.startIso),
    enddt: isoToRfc(params.endIso),
  })
  if (params.description) p.set("body", params.description)
  if (params.location) p.set("location", params.location)
  return `https://outlook.live.com/calendar/0/action/compose?${p.toString()}`
}

export function yahooCalendarUrl(params: CalendarEventParams): string {
  const startH = parseInt(params.startIso.slice(9, 11))
  const endH = parseInt(params.endIso.slice(9, 11))
  const durH = ((endH - startH) + 24) % 24
  const dur = `${String(durH).padStart(2, "0")}00`

  const p = new URLSearchParams({
    v: "60",
    title: params.title,
    st: params.startIso,
    dur,
  })
  if (params.description) p.set("desc", params.description)
  if (params.location) p.set("in_loc", params.location)
  return `https://calendar.yahoo.com/?${p.toString()}`
}

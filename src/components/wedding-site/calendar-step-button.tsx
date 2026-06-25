"use client"

import { CalendarPlus, ChevronDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  parseStepDateTime,
  googleCalendarUrl,
  outlookCalendarUrl,
  yahooCalendarUrl,
} from "@/lib/calendar"
import type { TimelineStep } from "@/queries/timeline"

interface Props {
  step: TimelineStep
  weddingDate: string | null
  weddingSlug: string
  location?: string
}

export function CalendarStepButton({ step, weddingDate, weddingSlug, location }: Props) {
  const dt = parseStepDateTime(weddingDate, step.time)
  if (!dt) return null

  const eventParams = {
    uid: `amora-${weddingSlug}-${step.id}@amora.fr`,
    title: step.emoji ? `${step.emoji} ${step.title}` : step.title,
    description: step.description ?? undefined,
    location,
    startIso: dt.start,
    endIso: dt.end,
  }

  const googleUrl = googleCalendarUrl(eventParams)
  const outlookUrl = outlookCalendarUrl(eventParams)
  const yahooUrl = yahooCalendarUrl(eventParams)
  const icsUrl = `/api/calendar/${weddingSlug}/${step.id}.ics`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          Ajouter à mon calendrier
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            Google Calendar
            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={icsUrl} download className="flex items-center gap-3">
            Apple&nbsp;/ iCal
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            Outlook
            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={yahooUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3"
          >
            Yahoo Calendar
            <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { getTimelineSteps } from "@/queries/timeline"
import { WeddingSettingsForm } from "@/components/dashboard/wedding-settings-form"
import { VisualForm } from "@/components/dashboard/visual-form"
import { StoryForm } from "@/components/dashboard/story-form"
import { PracticalInfoForm } from "@/components/dashboard/practical-info-form"
import { TimelineEditor } from "@/components/dashboard/timeline-editor"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Mon site mariage" }

export default async function SitePage() {
  const wedding = await getMyWedding()
  if (!wedding) return null

  const timelineSteps = await getTimelineSteps(wedding.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Mon site mariage</h1>
        <p className="text-sm text-muted-foreground">Personnalisez votre site public.</p>
      </div>

      <WeddingSettingsForm wedding={wedding} />

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Apparence</h2>
          <p className="text-sm text-muted-foreground">
            Couleur principale et police de titres de votre site mariage.
          </p>
        </div>
        <VisualForm wedding={wedding} />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Notre histoire</h2>
          <p className="text-sm text-muted-foreground">
            Racontez votre histoire et ajoutez jusqu&apos;à 3 photos souvenirs.
          </p>
        </div>
        <StoryForm wedding={wedding} />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Infos pratiques</h2>
          <p className="text-sm text-muted-foreground">
            Lieux, dress code et hébergements recommandés pour vos invités.
          </p>
        </div>
        <PracticalInfoForm wedding={wedding} />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Programme de la journée</h2>
          <p className="text-sm text-muted-foreground">
            Ajoutez les étapes de votre journée (cérémonie, cocktail, dîner…). Glissez-déposez pour réordonner.
          </p>
        </div>
        <TimelineEditor initialSteps={timelineSteps} weddingId={wedding.id} />
      </div>
    </div>
  )
}

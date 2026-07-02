import type { Metadata } from "next"
import { Eye } from "lucide-react"
import { getMyWedding } from "@/queries/wedding"
import { getTimelineSteps } from "@/queries/timeline"
import { WeddingSettingsForm } from "@/components/dashboard/wedding-settings-form"
import { CoverImageUploader } from "@/components/dashboard/cover-image-uploader"
import { VisualForm } from "@/components/dashboard/visual-form"
import { StoryForm } from "@/components/dashboard/story-form"
import { PracticalInfoForm } from "@/components/dashboard/practical-info-form"
import { TimelineEditor } from "@/components/dashboard/timeline-editor"
import { AccessCodeForm } from "@/components/dashboard/access-code-form"
import { SitePageLayout } from "@/components/dashboard/site-page-layout"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Mon site mariage" }

export default async function SitePage() {
  const wedding = await getMyWedding()
  if (!wedding) return null

  const timelineSteps = await getTimelineSteps(wedding.id)

  return (
    <SitePageLayout
      initial={{
        partner1: wedding.partner1_first_name,
        partner2: wedding.partner2_first_name,
        date: wedding.wedding_date ?? "",
        color: wedding.primary_color ?? "#C4714A",
        fontFamily: wedding.font_family ?? "Fraunces",
      }}
    >
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl">Mon site mariage</h1>
            <p className="text-sm text-muted-foreground">Personnalisez votre site public.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>
              <span className="font-medium tabular-nums text-foreground">
                {(wedding.view_count ?? 0).toLocaleString("fr-FR")}
              </span>
              {" "}vue{wedding.view_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div id="cover" className="scroll-mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Photo de couverture</h2>
            <p className="text-sm text-muted-foreground">
              La première image que vos invités verront en arrivant sur votre site.
            </p>
          </div>
          <CoverImageUploader wedding={wedding} />
        </div>

        <Separator />

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

        <Separator />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Confidentialité</h2>
            <p className="text-sm text-muted-foreground">
              Protégez votre site par un code d&apos;accès à partager dans vos invitations.
            </p>
          </div>
          <AccessCodeForm wedding={wedding} />
        </div>
      </div>
    </SitePageLayout>
  )
}

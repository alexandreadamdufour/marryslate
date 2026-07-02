"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import imageCompression from "browser-image-compression"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { uploadCoverImage, updateWedding } from "@/actions/wedding"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

export function CoverImageUploader({ wedding }: Props) {
  const [coverUrl, setCoverUrl] = useState(wedding.cover_image_url)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
      })

      const fd = new FormData()
      fd.append("file", compressed, file.name)
      fd.append("weddingId", wedding.id)

      const uploadResult = await uploadCoverImage(fd)
      if (uploadResult.error || uploadResult.data === undefined) {
        toast.error("Erreur lors de l'upload.")
        return
      }

      const updateResult = await updateWedding({
        weddingId: wedding.id,
        coverImageUrl: uploadResult.data.url,
      })
      if (updateResult.error) {
        toast.error("Erreur lors de l'enregistrement.")
        return
      }

      setCoverUrl(uploadResult.data.url)
      toast.success("Photo de couverture mise à jour", { duration: 3000 })
    } catch {
      toast.error("Erreur lors de la compression.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleRemove() {
    setRemoving(true)
    const result = await updateWedding({ weddingId: wedding.id, coverImageUrl: null })
    setRemoving(false)
    if (result.error) {
      toast.error("Erreur lors de la suppression.")
      return
    }
    setCoverUrl(null)
    toast.success("Photo de couverture retirée", { duration: 3000 })
  }

  const busy = uploading || removing

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={busy}
        onChange={handleChange}
      />

      {coverUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border bg-muted">
          <Image
            src={coverUrl}
            alt="Photo de couverture"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "Changer la photo"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={busy}
              onClick={handleRemove}
              aria-label="Retirer la photo de couverture"
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <Upload className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">Ajouter une photo de couverture</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

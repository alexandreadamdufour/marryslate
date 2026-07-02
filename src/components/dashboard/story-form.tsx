"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import imageCompression from "browser-image-compression"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateStorySchema, type UpdateStoryInput } from "@/lib/validators/story"
import { updateStory, uploadStoryImage } from "@/actions/story"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

export function StoryForm({ wedding }: Props) {
  const existingImages = (wedding.story_images as string[] | null) ?? []
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)

  const form = useForm<UpdateStoryInput>({
    resolver: zodResolver(updateStorySchema),
    defaultValues: {
      weddingId: wedding.id,
      storyTitle: wedding.story_title ?? "",
      storyText: wedding.story_md ?? "",
      storyImages: existingImages,
    },
  })

  async function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })

      const fd = new FormData()
      fd.append("file", compressed, file.name)
      fd.append("weddingId", wedding.id)

      const result = await uploadStoryImage(fd)
      if (result.error || result.data === undefined) {
        toast.error("Erreur lors de l'upload.")
        return
      }

      const next = [...images, result.data.url]
      setImages(next)
      form.setValue("storyImages", next)
    } catch {
      toast.error("Erreur lors de la compression.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    form.setValue("storyImages", next)
  }

  async function onSubmit(values: UpdateStoryInput) {
    const result = await updateStory({ ...values, storyImages: images })
    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
      return
    }
    toast.success("Histoire enregistrée", { duration: 3000 })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        {/* Titre */}
        <FormField
          control={form.control}
          name="storyTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Notre histoire" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Laissez vide pour afficher &laquo;&nbsp;Notre histoire&nbsp;&raquo;.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Texte */}
        <FormField
          control={form.control}
          name="storyText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre histoire *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Racontez comment vous vous êtes rencontrés…"
                  rows={8}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Jusqu&apos;à 10&nbsp;000 caractères.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photos */}
        <div className="space-y-3">
          <p className="text-sm font-medium leading-none">Photos</p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-square">
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  sizes="160px"
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={uploading}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                  aria-label={`Supprimer la photo ${i + 1}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}

            {/* Bouton ajout — toujours en dernier */}
            <label
              className={[
                "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-colors",
                uploading
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-primary hover:text-primary",
              ].join(" ")}
              aria-label="Ajouter une photo"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  <span className="mt-1 text-xs">Ajouter</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={handleAddImage}
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || uploading}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </Form>
  )
}

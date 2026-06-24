"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import imageCompression from "browser-image-compression"
import { Loader2, Upload, X, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { createGift, updateGift, uploadGiftImage } from "@/actions/gifts"
import type { Gift } from "@/queries/gifts"

const formSchema = z.object({
  title: z.string().min(1, "Requis").max(120),
  description: z.string().max(2000).optional(),
  targetAmount: z.coerce.number().min(1, "Minimum 1 €").max(50000, "Maximum 50 000 €"),
  externalUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  category: z.string().max(50).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface GiftFormProps {
  weddingId: string
  gift?: Gift
  onSuccess: () => void
}

export function GiftForm({ weddingId, gift, onSuccess }: GiftFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(gift?.image_url ?? null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: gift?.title ?? "",
      description: gift?.description ?? "",
      targetAmount: gift?.target_amount ? Number(gift.target_amount) : undefined,
      externalUrl: gift?.external_url ?? "",
      category: gift?.category ?? "",
    },
  })

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })

      const formData = new FormData()
      formData.append("file", compressed, file.name)
      formData.append("weddingId", weddingId)

      const result = await uploadGiftImage(formData)
      if ("error" in result) {
        toast.error("Erreur lors de l'upload de l'image")
      } else {
        setImageUrl(result.data.url)
      }
    } catch {
      toast.error("Erreur lors de la compression de l'image")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      description: values.description || null,
      targetAmount: values.targetAmount,
      imageUrl: imageUrl,
      externalUrl: values.externalUrl || null,
      category: values.category || null,
    }

    let result
    if (gift) {
      result = await updateGift({ giftId: gift.id, ...payload })
    } else {
      result = await createGift({ weddingId, ...payload })
    }

    if ("error" in result) {
      toast.error("Une erreur est survenue. Veuillez réessayer.")
      return
    }

    toast.success(gift ? "Cadeau mis à jour" : "Cadeau ajouté")
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Image */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Image</p>
          {imageUrl ? (
            <div className="relative w-full">
              <Image
                src={imageUrl}
                alt="Aperçu"
                width={400}
                height={200}
                className="h-40 w-full rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Supprimer l'image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Choisir une image (JPG, PNG, WebP — max 5 Mo)</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={handleImageChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du cadeau *</FormLabel>
              <FormControl>
                <Input placeholder="Valise cabine Rimowa" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant cible *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={50000}
                    step={1}
                    placeholder="150"
                    className="pr-8"
                    {...field}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Un bagage de qualité pour notre voyage de noces…"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="externalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lien marchand</FormLabel>
              <FormControl>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="https://www.rimowa.com/…"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>Optionnel — pour que les invités voient le produit.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl>
                <Input placeholder="Voyage, Maison, Expérience…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting || uploading} className="flex-1">
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : gift ? (
              "Enregistrer"
            ) : (
              "Ajouter le cadeau"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

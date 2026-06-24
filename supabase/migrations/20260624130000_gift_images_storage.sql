-- Migration: Supabase Storage bucket pour les images cadeaux
-- Les uploads passent par le service_role (Server Action), donc pas de policy d'écriture nécessaire.
-- Le bucket est public → images lisibles sans auth (requis pour le site mariage public).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gift-images',
  'gift-images',
  true,
  5242880,                                             -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

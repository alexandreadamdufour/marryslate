-- Migration: RSVP responses
-- Ajoute la fonctionnalité RSVP : formulaire public sur le site mariage,
-- réponses stockées dans rsvp_responses, activable par mariage.

-- 1. Flag d'activation sur le wedding
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS rsvp_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.weddings.rsvp_enabled IS
  'Affiche le formulaire RSVP public sur le site mariage quand true.';

-- 2. Table des réponses RSVP
CREATE TABLE public.rsvp_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  first_name  text NOT NULL CHECK (length(first_name) BETWEEN 1 AND 100),
  last_name   text NOT NULL CHECK (length(last_name) BETWEEN 1 AND 100),
  email       citext CHECK (email IS NULL OR length(email) <= 320),
  attending   boolean NOT NULL,
  guest_count int NOT NULL DEFAULT 1 CHECK (guest_count >= 1 AND guest_count <= 20),
  dietary     text CHECK (dietary IS NULL OR length(dietary) <= 500),
  message     text CHECK (message IS NULL OR length(message) <= 1000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rsvp_responses_wedding_id
  ON public.rsvp_responses (wedding_id, created_at DESC);

-- 3. RLS
ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;

-- Les coowners lisent toutes les réponses de leur mariage
CREATE POLICY "rsvp_responses_select_coowner" ON public.rsvp_responses
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- N'importe qui peut insérer si le wedding est publié ET rsvp activé
CREATE POLICY "rsvp_responses_insert_public" ON public.rsvp_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id
        AND is_published = true
        AND rsvp_enabled = true
    )
  );

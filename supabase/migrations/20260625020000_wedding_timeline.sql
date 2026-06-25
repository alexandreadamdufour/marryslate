-- Migration: programme de la journée (wedding_timeline)

CREATE TABLE public.wedding_timeline (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  time        text NOT NULL CHECK (length(time) BETWEEN 1 AND 20),
  title       text NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description text CHECK (description IS NULL OR length(description) <= 500),
  emoji       text CHECK (emoji IS NULL OR length(emoji) <= 10),
  position    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wedding_timeline_wedding_id
  ON public.wedding_timeline (wedding_id, position ASC);

ALTER TABLE public.wedding_timeline ENABLE ROW LEVEL SECURITY;

-- Lecture publique si le wedding est publié
CREATE POLICY "timeline_select_public" ON public.wedding_timeline
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND is_published = true
    )
  );

-- Lecture par les coowners (y compris si non publié)
CREATE POLICY "timeline_select_coowner" ON public.wedding_timeline
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- Mutations réservées aux coowners — gérées par service_role dans les Server Actions

-- Extension de la table guests avec les champs de gestion manuelle des invités.
-- rsvp_status est text (pas ENUM) pour éviter 22P02 : PostgREST appelle auth.uid()::uuid
-- en interne sur les tables avec des colonnes ENUM, et Clerk sub = 'user_xxx' n'est pas UUID.
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS phone           text,
  ADD COLUMN IF NOT EXISTS dietary         text,
  ADD COLUMN IF NOT EXISTS plus_one        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plus_one_name   text,
  ADD COLUMN IF NOT EXISTS invitation_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rsvp_status     text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes           text;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_rsvp_status_check
  CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe'));

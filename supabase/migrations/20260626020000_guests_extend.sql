-- Extension de la table guests avec les champs de gestion manuelle des invités
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS phone          text,
  ADD COLUMN IF NOT EXISTS dietary        text,
  ADD COLUMN IF NOT EXISTS plus_one       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plus_one_name  text,
  ADD COLUMN IF NOT EXISTS invitation_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rsvp_status    rsvp_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes          text;

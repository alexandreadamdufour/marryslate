-- Migration: RSVP responses — matching guest_id + status
-- Ajoute le lien vers guests et le statut de matching pour l'unification RSVP
-- (voir SPECS-RSVP.md). Modèle liste fermée : chaque réponse publique est
-- rattachée (ou non) à un invité de la liste maître via matching par email.

ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status    text NOT NULL DEFAULT 'pending_validation';

ALTER TABLE public.rsvp_responses
  ADD CONSTRAINT rsvp_responses_status_check
  CHECK (status IN ('matched', 'pending_validation', 'conflict', 'rejected'));

COMMENT ON COLUMN public.rsvp_responses.guest_id IS
  'Invité de la liste maître rattaché à cette réponse. NULL si aucun match trouvé (file de validation) ou si rejeté.';

COMMENT ON COLUMN public.rsvp_responses.status IS
  'matched: rattaché automatiquement par email, guests.rsvp_status mis à jour.
   pending_validation: aucun match par email, en attente de traitement par le couple.
   conflict: match trouvé mais réponse divergente d''une réponse antérieure pour ce guest_id ; guests.rsvp_status non écrasé, le couple tranche.
   rejected: écarté par le couple (spam), conservé pour traçabilité, exclu de la vue par défaut.';

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_guest_id
  ON public.rsvp_responses (guest_id)
  WHERE guest_id IS NOT NULL;

-- Le couple (owner ou coowner) doit pouvoir rattacher/valider/trancher une réponse
-- depuis le dashboard. Aucune policy UPDATE n'existait jusqu'ici.
CREATE POLICY "rsvp_responses_update_coowner" ON public.rsvp_responses
  FOR UPDATE
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

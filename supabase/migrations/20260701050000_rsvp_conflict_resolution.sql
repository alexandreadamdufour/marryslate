-- Migration : résolution de conflits RSVP (incrément 2, SPECS-RSVP.md)
-- À EXÉCUTER À LA MAIN dans le SQL Editor Supabase (pas de CLI supabase configurée en local).

ALTER TABLE public.rsvp_responses
  DROP CONSTRAINT rsvp_responses_status_check;

ALTER TABLE public.rsvp_responses
  ADD CONSTRAINT rsvp_responses_status_check
  CHECK (status IN ('matched', 'pending_validation', 'conflict', 'rejected', 'resolved_kept_couple'));

ALTER TABLE public.rsvp_responses
  ADD COLUMN IF NOT EXISTS conflict_resolved_at timestamptz NULL;

COMMENT ON COLUMN public.rsvp_responses.conflict_resolved_at IS
  'Timestamp de résolution manuelle d''un conflit via resolveRsvpConflict. NULL tant que non résolu ou si jamais en conflit.';

COMMENT ON COLUMN public.rsvp_responses.status IS
  'matched: rattaché par email ou résolution "appliquer la réponse invité" — guests.rsvp_status reflète cette réponse.
   pending_validation: aucun match par email, en attente de traitement par le couple.
   conflict: réponse divergente (couple ou double réponse même email) — guests.rsvp_status non écrasé, en attente d''arbitrage.
   resolved_kept_couple: conflit résolu en gardant la saisie du couple — guests.rsvp_status volontairement PAS aligné sur cette réponse.
   rejected: écarté par le couple (spam), conservé pour traçabilité, exclu de la vue par défaut.';

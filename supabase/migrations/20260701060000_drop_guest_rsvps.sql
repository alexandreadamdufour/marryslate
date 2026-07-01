-- Migration : DROP de la table morte guest_rsvps (SPECS-RSVP.md, nettoyage final incrément RSVP).
-- À EXÉCUTER À LA MAIN dans le SQL Editor Supabase.
-- PRÉREQUIS : vérifier SELECT COUNT(*) FROM guest_rsvps = 0 AVANT.

DROP TABLE IF EXISTS public.guest_rsvps;
DROP TYPE IF EXISTS public.rsvp_status;

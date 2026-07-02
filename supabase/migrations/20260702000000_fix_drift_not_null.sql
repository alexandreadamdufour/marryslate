-- Audit synchro migrations↔prod (ETAT.md "Audit synchro migrations↔prod") :
-- ces 16 colonnes sont NOT NULL dans les migrations d'origine mais nullable en prod
-- (tables probablement créées à la main avant l'écriture des migrations "officielles").
-- Audit exécuté le 2026-07-02 : 0 ligne NULL sur les 16 colonnes / 166 lignes prod
-- confondues → aucun backfill nécessaire, SET NOT NULL direct.

BEGIN;

-- budget_items -----------------------------------------------------------------
ALTER TABLE public.budget_items ALTER COLUMN wedding_id SET NOT NULL;

-- checklist_items ----------------------------------------------------------------
ALTER TABLE public.checklist_items ALTER COLUMN wedding_id SET NOT NULL;
ALTER TABLE public.checklist_items ALTER COLUMN is_completed SET NOT NULL;
ALTER TABLE public.checklist_items ALTER COLUMN priority SET NOT NULL;
ALTER TABLE public.checklist_items ALTER COLUMN created_at SET NOT NULL;

-- seating_tables -------------------------------------------------------------
ALTER TABLE public.seating_tables ALTER COLUMN wedding_id SET NOT NULL;
ALTER TABLE public.seating_tables ALTER COLUMN capacity SET NOT NULL;
ALTER TABLE public.seating_tables ALTER COLUMN position_x SET NOT NULL;
ALTER TABLE public.seating_tables ALTER COLUMN position_y SET NOT NULL;

-- wedding_timeline -------------------------------------------------------------
ALTER TABLE public.wedding_timeline ALTER COLUMN wedding_id SET NOT NULL;

-- rsvp_responses -------------------------------------------------------------
ALTER TABLE public.rsvp_responses ALTER COLUMN guest_count SET NOT NULL;
ALTER TABLE public.rsvp_responses ALTER COLUMN created_at SET NOT NULL;

-- weddings -------------------------------------------------------------
ALTER TABLE public.weddings ALTER COLUMN access_code_enabled SET NOT NULL;
ALTER TABLE public.weddings ALTER COLUMN notifications_enabled SET NOT NULL;
ALTER TABLE public.weddings ALTER COLUMN rsvp_enabled SET NOT NULL;
ALTER TABLE public.weddings ALTER COLUMN is_published SET NOT NULL;

COMMIT;

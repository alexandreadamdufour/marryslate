-- Les policies seating avaient été créées via le Dashboard Supabase avec auth.uid()
-- au lieu de is_wedding_coowner(). auth.uid() caste request.jwt.claim.sub en uuid →
-- 22P02 avec les ids Clerk text ('user_xxx'). Fix : aligner sur le modèle guests.
--
-- Note : la migration de création (20260626030000_seating.sql) utilisait des noms avec
-- underscore ("seating_tables"), le Dashboard avait créé des noms avec espace ("seating tables").
-- Les 4 DROP IF EXISTS couvrent les deux variantes pour qu'un db reset ne casse pas la chaîne.

BEGIN;

DROP POLICY IF EXISTS "Coowners can manage seating tables"       ON public.seating_tables;
DROP POLICY IF EXISTS "Coowners can manage seating_tables"       ON public.seating_tables;
DROP POLICY IF EXISTS "Coowners can manage seating assignments"  ON public.seating_assignments;
DROP POLICY IF EXISTS "Coowners can manage seating_assignments"  ON public.seating_assignments;

CREATE POLICY "Coowners can manage seating tables"
  ON public.seating_tables FOR ALL
  USING  (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "Coowners can manage seating assignments"
  ON public.seating_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.seating_tables t
      WHERE t.id = table_id
        AND public.is_wedding_coowner(t.wedding_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seating_tables t
      WHERE t.id = table_id
        AND public.is_wedding_coowner(t.wedding_id)
    )
  );

COMMIT;

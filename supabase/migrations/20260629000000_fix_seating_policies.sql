-- Les policies seating avaient été créées avec auth.uid() (template Supabase Dashboard)
-- au lieu de is_wedding_coowner(). auth.uid() caste request.jwt.claim.sub en uuid →
-- 22P02 avec les ids Clerk text ('user_xxx'). Fix : aligner sur le modèle guests.

BEGIN;

DROP POLICY "Coowners can manage seating tables"      ON public.seating_tables;
DROP POLICY "Coowners can manage seating assignments" ON public.seating_assignments;

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

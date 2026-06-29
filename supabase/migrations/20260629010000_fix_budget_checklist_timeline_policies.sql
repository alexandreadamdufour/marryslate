-- budget_items et checklist_items : policies créées via Supabase Dashboard avec auth.uid()
-- (cast uuid → 22P02 avec les ids Clerk text). Même bug que seating_tables corrigé dans
-- 20260629000000_fix_seating_policies.sql.
-- wedding_timeline : aucune policy DML coowner n'existait (mutation → default DENY).

BEGIN;

-- budget_items ---------------------------------------------------------------

DROP POLICY "Coowners can manage budget items" ON public.budget_items;

CREATE POLICY "Coowners can manage budget items"
  ON public.budget_items FOR ALL
  USING  (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

-- checklist_items -------------------------------------------------------------

DROP POLICY "Coowners can manage checklist items" ON public.checklist_items;

CREATE POLICY "Coowners can manage checklist items"
  ON public.checklist_items FOR ALL
  USING  (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

-- wedding_timeline ------------------------------------------------------------
-- La policy SELECT publique ("Public can read timeline of published weddings") n'est pas touchée.
-- On ajoute uniquement la policy DML manquante.

CREATE POLICY "Coowners can manage timeline"
  ON public.wedding_timeline FOR ALL
  USING  (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

COMMIT;

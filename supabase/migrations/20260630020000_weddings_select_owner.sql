-- Le owner doit pouvoir lire son propre wedding même non publié et avant
-- que wedding_coowners soit peuplé (INSERT + RETURNING dans createWedding).
-- Sans cette policy, INSERT ... RETURNING échoue en 42501 car weddings_select_published
-- (is_published=false) et weddings_select_coowner (table vide) échouent toutes les deux.
CREATE POLICY "weddings_select_owner" ON public.weddings
  FOR SELECT
  USING (owner_id = public.current_user_id());

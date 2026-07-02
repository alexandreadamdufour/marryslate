-- guests_select_owner : policy SELECT dédiée basée directement sur weddings.owner_id,
-- indépendante de is_wedding_coowner(). Défense en profondeur : la policy existante
-- guests_all_coowner (FOR ALL) couvre déjà le owner depuis le fix du 2026-07-01
-- (20260701000000_fix_is_wedding_coowner_include_owner.sql, owner OR coowner dans la
-- fonction elle-même). Cette policy ne comble donc pas un trou d'accès actif
-- aujourd'hui, mais évite que guests (données PII : noms, contacts d'invités) dépende
-- entièrement d'une seule fonction partagée par ~26 policies — une régression future
-- sur is_wedding_coowner() ne rendrait pas le owner aveugle sur cette table précise.
-- Policies permissives multiples sur un même command = combinées en OR par Postgres,
-- aucun conflit avec guests_all_coowner.

CREATE POLICY "guests_select_owner" ON public.guests
  FOR SELECT
  USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = public.current_user_id()
    )
  );

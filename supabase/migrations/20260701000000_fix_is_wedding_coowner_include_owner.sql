-- Fix : is_wedding_coowner() ne vérifiait que wedding_coowners, pas weddings.owner_id.
-- Conséquence : le owner d'un wedding ne passait pas les policies RLS sur toutes les
-- tables enfants (gifts, contributions, guests, rsvp_responses, budget_items, etc.)
-- tant qu'il n'était pas explicitement présent dans wedding_coowners.
-- createWedding insère bien le owner dans wedding_coowners après le INSERT weddings,
-- mais entre les deux (et en cas d'échec de ce deuxième INSERT), le owner était aveugle.
-- Fix : ajouter le check direct sur weddings.owner_id en OR.
-- Déjà appliqué en prod le 2026-07-01.

CREATE OR REPLACE FUNCTION public.is_wedding_coowner(p_wedding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.weddings
    WHERE id = p_wedding_id AND owner_id = public.current_user_id()
  ) OR EXISTS (
    SELECT 1 FROM public.wedding_coowners
    WHERE wedding_id = p_wedding_id AND user_id = public.current_user_id()
  )
$$;

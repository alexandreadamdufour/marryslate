-- Durcissement sécurité (WARN Supabase function_search_path_mutable).
-- Fixe search_path sur les fonctions qui ne l'avaient pas, empêche le
-- détournement via résolution de schéma. is_wedding_coowner déjà corrigée.
ALTER FUNCTION public.clerk_user_id() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_gift_current_amount() SET search_path = public;

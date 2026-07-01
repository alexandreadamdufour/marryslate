-- Durcissement : retire aux utilisateurs anonymes le droit d'appeler ces
-- fonctions SECURITY DEFINER via /rest/v1/rpc/ (WARN Supabase). anon ne les
-- utilise jamais (ni code ni policies publiques). Le REVOKE FROM authenticated
-- n'est PAS fait : casserait assertWeddingCoowner (.rpc dans 12 actions) et les
-- policies qui appellent current_user_id(). Refactor SELECT-direct à prévoir.
REVOKE EXECUTE ON FUNCTION public.is_wedding_coowner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_id() FROM anon;

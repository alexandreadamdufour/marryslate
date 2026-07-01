-- Durcissement : retire à PUBLIC (donc anon) le droit d'exécuter ces fonctions
-- SECURITY DEFINER via /rest/v1/rpc/ (WARN Supabase anon_security_definer).
-- Le REVOKE FROM anon initial ne marchait pas : le droit venait de PUBLIC (grant
-- par défaut), pas d'un grant explicite à anon. authenticated et service_role
-- conservent leurs grants explicites. Le WARN authenticated_security_definer
-- reste ouvert volontairement (refactor assertWeddingCoowner à prévoir).
REVOKE EXECUTE ON FUNCTION public.current_user_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_wedding_coowner(uuid) FROM PUBLIC;

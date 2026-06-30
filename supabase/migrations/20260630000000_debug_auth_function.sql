CREATE OR REPLACE FUNCTION public.debug_auth()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'role',            auth.role(),
    'sub',             auth.jwt() ->> 'sub',
    'jwt_full',        auth.jwt(),
    'current_user_id', public.current_user_id()
  )
$$;

GRANT EXECUTE ON FUNCTION public.debug_auth() TO authenticated, anon;

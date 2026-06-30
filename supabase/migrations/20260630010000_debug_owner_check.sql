CREATE OR REPLACE FUNCTION public.debug_owner_check()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'cui',        public.current_user_id(),
    'cui_type',   pg_typeof(public.current_user_id())::text,
    'owner_check', ('624b8d34-3e3e-43ec-9ad0-b09305891718'::uuid = public.current_user_id())
  )
$$;

GRANT EXECUTE ON FUNCTION public.debug_owner_check() TO authenticated, anon;

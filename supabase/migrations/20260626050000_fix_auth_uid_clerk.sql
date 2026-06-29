-- auth.uid() est défini par Supabase comme RETURNS uuid avec un cast inconditionnel ::uuid.
-- Pour les JWTs Clerk, sub = 'user_xxx' (text) → le cast explose avec 22P02.
-- TPA (Third-Party Auth JWKS) corrige la vérification de signature mais pas cette fonction.
--
-- Fix : remplacer le cast inconditionnel par un handler d'exception PL/pgSQL
-- qui retourne NULL pour les sub non-UUID (Clerk IDs).
-- Impact : les policies qui utiliseraient auth.uid() = <uuid_col> évaluent NULL = x → false
-- (accès refusé proprement, pas d'erreur). Toutes les policies du projet utilisent
-- is_wedding_coowner() → clerk_user_id() → auth.jwt()->>'sub' : zéro impact.

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  sub text;
BEGIN
  sub := coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  );
  RETURN sub::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

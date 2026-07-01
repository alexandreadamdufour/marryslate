-- guestbook_messages : pas de policy INSERT publique.
-- Insertion exclusivement via Server Action (service_role) qui bypasse la RLS
-- et applique Zod + rate limiting + check is_published avant l'INSERT.
-- Une policy manuelle "WITH CHECK (true)" créée en prod par erreur ouvrait
-- l'INSERT direct via anon (contournant l'anti-spam applicatif). Supprimée.
DROP POLICY IF EXISTS "Public can insert guestbook messages" ON public.guestbook_messages;

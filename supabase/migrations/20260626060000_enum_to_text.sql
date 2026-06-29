-- Root cause: PostgREST appelle auth.uid() (RETURNS uuid, cast inconditionnel) en interne
-- sur le chemin DML des tables qui ont des colonnes de type ENUM (user-defined types).
-- Ce chemin ne peut pas être contourné côté policies (qui n'appellent jamais auth.uid()),
-- et auth.uid() ne peut pas être redéfini (permission denied sur le schéma auth).
--
-- Fix : remplacer les colonnes ENUM par text + CHECK sur les tables qui passent
-- par le client Clerk RLS. Les valeurs existantes sont préservées via USING.
-- guests.rsvp_status est créé directement en text dans guests_extend.sql.
-- rsvp_status ENUM reste en place pour guest_rsvps.status (passe par service_role).

BEGIN;

-- guests.side : wedding_side → text
ALTER TABLE public.guests ALTER COLUMN side DROP DEFAULT;
ALTER TABLE public.guests ALTER COLUMN side TYPE text USING side::text;
ALTER TABLE public.guests ALTER COLUMN side SET DEFAULT 'both';
ALTER TABLE public.guests ADD CONSTRAINT guests_side_check
  CHECK (side IN ('partner1', 'partner2', 'both'));

-- checklist_items.priority : checklist_priority → text
ALTER TABLE public.checklist_items ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE public.checklist_items ALTER COLUMN priority TYPE text USING priority::text;
ALTER TABLE public.checklist_items ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE public.checklist_items ADD CONSTRAINT checklist_items_priority_check
  CHECK (priority IN ('high', 'medium', 'low'));

-- withdrawals.status : withdrawal_status → text
ALTER TABLE public.withdrawals ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.withdrawals ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.withdrawals ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check
  CHECK (status IN ('pending', 'processing', 'succeeded', 'failed'));

DROP TYPE public.wedding_side;
DROP TYPE public.checklist_priority;
DROP TYPE public.withdrawal_status;

COMMIT;

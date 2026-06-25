-- Migration: soft-delete sur les users
-- Ajoute deleted_at pour marquer un compte supprimé de Clerk
-- sans perdre les contributions et données financières associées.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.users.deleted_at IS
  'Non-null quand le compte Clerk a été supprimé. Le user ne peut plus '
  'se connecter (Clerk l''en empêche), mais ses données sont conservées '
  'pour l''historique comptable.';

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON public.users (deleted_at)
  WHERE deleted_at IS NOT NULL;

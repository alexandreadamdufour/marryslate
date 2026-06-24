-- =============================================================================
-- Migration 0001 — Schéma initial
-- =============================================================================
-- Auth model : Clerk (third-party auth Supabase). Les JWT Clerk sont validés
-- par Supabase. On accède au clerk_user_id via auth.jwt() ->> 'sub'.
--
-- Convention :
--   - users.id          = UUID interne Supabase (PK applicative)
--   - users.clerk_user_id = TEXT (sub du JWT Clerk, UNIQUE)
--
-- Toutes les RLS comparent avec public.current_user_id() (helper défini plus bas)
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";         -- email case-insensitive

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('couple', 'admin');

CREATE TYPE kyc_status AS ENUM ('not_started', 'pending', 'validated', 'rejected');

CREATE TYPE wedding_side AS ENUM ('partner1', 'partner2', 'both');

CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined', 'maybe');

CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'succeeded', 'failed');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Retourne le clerk_user_id depuis le JWT (sub)
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')::text
$$;

-- Retourne le users.id interne associé au JWT courant
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE clerk_user_id = public.clerk_user_id()
$$;

-- Trigger générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLE : users
-- =============================================================================
CREATE TABLE public.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text UNIQUE NOT NULL,
  email           citext NOT NULL,
  display_name    text,
  role            user_role NOT NULL DEFAULT 'couple',
  mangopay_user_id text UNIQUE,
  kyc_status      kyc_status NOT NULL DEFAULT 'not_started',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_clerk_user_id ON public.users (clerk_user_id);
CREATE INDEX idx_users_email ON public.users (email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : weddings
-- =============================================================================
CREATE TABLE public.weddings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  partner1_first_name text NOT NULL,
  partner2_first_name text NOT NULL,
  wedding_date        date,
  slug                text UNIQUE NOT NULL,
  cover_image_url     text,
  theme_id            text NOT NULL DEFAULT 'classic',
  primary_color       text,
  story_md            text,
  is_published        boolean NOT NULL DEFAULT false,
  mangopay_wallet_id  text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 60)
);

CREATE INDEX idx_weddings_owner_id ON public.weddings (owner_id);
CREATE INDEX idx_weddings_slug ON public.weddings (slug);
CREATE INDEX idx_weddings_published ON public.weddings (is_published) WHERE is_published = true;

CREATE TRIGGER trg_weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : wedding_coowners
-- =============================================================================
CREATE TABLE public.wedding_coowners (
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wedding_id, user_id)
);

CREATE INDEX idx_wedding_coowners_user_id ON public.wedding_coowners (user_id);

-- Helper : est-ce que current_user_id est coowner d'un wedding ?
CREATE OR REPLACE FUNCTION public.is_wedding_coowner(p_wedding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wedding_coowners
    WHERE wedding_id = p_wedding_id
      AND user_id = public.current_user_id()
  )
$$;

-- =============================================================================
-- TABLE : gifts
-- =============================================================================
CREATE TABLE public.gifts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id      uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  image_url       text,
  target_amount   numeric(10,2) NOT NULL CHECK (target_amount > 0 AND target_amount <= 50000),
  current_amount  numeric(10,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  category        text,
  external_url    text,
  is_active       boolean NOT NULL DEFAULT true,
  position        int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gifts_wedding_id ON public.gifts (wedding_id);
CREATE INDEX idx_gifts_wedding_active_position ON public.gifts (wedding_id, position) WHERE is_active = true;

CREATE TRIGGER trg_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : contributions
-- =============================================================================
CREATE TABLE public.contributions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id           uuid NOT NULL REFERENCES public.weddings(id) ON DELETE RESTRICT,
  gift_id              uuid REFERENCES public.gifts(id) ON DELETE SET NULL,
  guest_name           text NOT NULL,
  guest_email          citext,
  guest_message        text,
  gross_amount         numeric(10,2) NOT NULL CHECK (gross_amount > 0),
  fee_amount           numeric(10,2) NOT NULL CHECK (fee_amount >= 0),
  net_amount           numeric(10,2) NOT NULL CHECK (net_amount >= 0),
  mangopay_payment_id  text UNIQUE,
  payment_status       payment_status NOT NULL DEFAULT 'pending',
  is_anonymous         boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT amounts_consistent CHECK (gross_amount = fee_amount + net_amount)
);

CREATE INDEX idx_contributions_wedding_id ON public.contributions (wedding_id);
CREATE INDEX idx_contributions_gift_id ON public.contributions (gift_id);
CREATE INDEX idx_contributions_status ON public.contributions (payment_status);
CREATE INDEX idx_contributions_mangopay_id ON public.contributions (mangopay_payment_id) WHERE mangopay_payment_id IS NOT NULL;

CREATE TRIGGER trg_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger : mettre à jour gifts.current_amount quand une contribution est succeeded
CREATE OR REPLACE FUNCTION public.update_gift_current_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.gift_id IS NOT NULL THEN
    -- Recalcule depuis zéro pour éviter dérive
    UPDATE public.gifts
    SET current_amount = (
      SELECT COALESCE(SUM(net_amount), 0)
      FROM public.contributions
      WHERE gift_id = NEW.gift_id AND payment_status = 'succeeded'
    )
    WHERE id = NEW.gift_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contributions_update_gift_amount
  AFTER INSERT OR UPDATE OF payment_status, net_amount, gift_id ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_gift_current_amount();

-- =============================================================================
-- TABLE : wedding_events
-- =============================================================================
CREATE TABLE public.wedding_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id        uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title             text NOT NULL,
  start_at          timestamptz,
  end_at            timestamptz,
  location_name     text,
  location_address  text,
  location_lat      numeric(9,6),
  location_lng      numeric(10,6),
  dress_code        text,
  description       text,
  position          int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_dates_consistent CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

CREATE INDEX idx_wedding_events_wedding_id ON public.wedding_events (wedding_id, position);

CREATE TRIGGER trg_wedding_events_updated_at
  BEFORE UPDATE ON public.wedding_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : guests
-- =============================================================================
CREATE TABLE public.guests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  first_name  text,
  last_name   text,
  email       citext,
  group_name  text,
  side        wedding_side NOT NULL DEFAULT 'both',
  rsvp_token  text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guests_wedding_id ON public.guests (wedding_id);
CREATE INDEX idx_guests_rsvp_token ON public.guests (rsvp_token);

CREATE TRIGGER trg_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : guest_rsvps
-- =============================================================================
CREATE TABLE public.guest_rsvps (
  guest_id              uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  event_id              uuid NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  status                rsvp_status NOT NULL DEFAULT 'pending',
  guests_count          int NOT NULL DEFAULT 1 CHECK (guests_count >= 0 AND guests_count <= 10),
  dietary_restrictions  text,
  responded_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, event_id)
);

CREATE INDEX idx_guest_rsvps_event_id ON public.guest_rsvps (event_id);

CREATE TRIGGER trg_guest_rsvps_updated_at
  BEFORE UPDATE ON public.guest_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : withdrawals
-- =============================================================================
CREATE TABLE public.withdrawals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id          uuid NOT NULL REFERENCES public.weddings(id) ON DELETE RESTRICT,
  amount              numeric(10,2) NOT NULL CHECK (amount > 0),
  iban_last4          text,
  mangopay_payout_id  text UNIQUE,
  status              withdrawal_status NOT NULL DEFAULT 'pending',
  requested_at        timestamptz NOT NULL DEFAULT now(),
  processed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawals_wedding_id ON public.withdrawals (wedding_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals (status);

CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- TABLE : guestbook_messages
-- =============================================================================
CREATE TABLE public.guestbook_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  message     text NOT NULL CHECK (length(message) BETWEEN 1 AND 2000),
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_guestbook_messages_wedding_id ON public.guestbook_messages (wedding_id, created_at DESC) WHERE is_visible = true;

-- =============================================================================
-- TABLE : audit_logs (actions sensibles)
-- =============================================================================
CREATE TABLE public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  wedding_id  uuid REFERENCES public.weddings(id) ON DELETE SET NULL,
  action      text NOT NULL,
  metadata    jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_wedding_id ON public.audit_logs (wedding_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action, created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY — ACTIVATION
-- =============================================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_coowners   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_rsvps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES : users
-- =============================================================================
-- Un user lit son propre profil
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (clerk_user_id = public.clerk_user_id());

-- Un user update son propre profil (champs limités côté app)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (clerk_user_id = public.clerk_user_id())
  WITH CHECK (clerk_user_id = public.clerk_user_id());

-- Les insert sont gérés par webhook Clerk (service_role)

-- =============================================================================
-- POLICIES : weddings
-- =============================================================================
-- Lecture publique des weddings publiés
CREATE POLICY "weddings_select_published" ON public.weddings
  FOR SELECT
  USING (is_published = true);

-- Coowners voient leur wedding même non publié
CREATE POLICY "weddings_select_coowner" ON public.weddings
  FOR SELECT
  USING (public.is_wedding_coowner(id));

-- Création par user authentifié (sera owner automatiquement)
CREATE POLICY "weddings_insert_authenticated" ON public.weddings
  FOR INSERT
  WITH CHECK (owner_id = public.current_user_id());

-- Update par coowners
CREATE POLICY "weddings_update_coowner" ON public.weddings
  FOR UPDATE
  USING (public.is_wedding_coowner(id))
  WITH CHECK (public.is_wedding_coowner(id));

-- Delete par owner uniquement (pas tous les coowners)
CREATE POLICY "weddings_delete_owner" ON public.weddings
  FOR DELETE
  USING (owner_id = public.current_user_id());

-- =============================================================================
-- POLICIES : wedding_coowners
-- =============================================================================
CREATE POLICY "wedding_coowners_select_self" ON public.wedding_coowners
  FOR SELECT
  USING (
    user_id = public.current_user_id()
    OR public.is_wedding_coowner(wedding_id)
  );

-- Insert : seulement le owner du wedding peut ajouter un coowner
CREATE POLICY "wedding_coowners_insert_owner" ON public.wedding_coowners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND owner_id = public.current_user_id()
    )
  );

CREATE POLICY "wedding_coowners_delete_owner" ON public.wedding_coowners
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND owner_id = public.current_user_id()
    )
  );

-- =============================================================================
-- POLICIES : gifts
-- =============================================================================
-- Lecture publique si wedding publié
CREATE POLICY "gifts_select_public" ON public.gifts
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND is_published = true
    )
  );

-- Lecture par coowners (même non publié, même inactifs)
CREATE POLICY "gifts_select_coowner" ON public.gifts
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- ALL pour coowners
CREATE POLICY "gifts_insert_coowner" ON public.gifts
  FOR INSERT
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "gifts_update_coowner" ON public.gifts
  FOR UPDATE
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "gifts_delete_coowner" ON public.gifts
  FOR DELETE
  USING (public.is_wedding_coowner(wedding_id));

-- =============================================================================
-- POLICIES : contributions
-- =============================================================================
-- Lecture publique des contributions non anonymes pour les weddings publiés
-- (le SELECT côté app filtre les colonnes sensibles : pas de guest_email, fee_amount, mangopay_id)
CREATE POLICY "contributions_select_public" ON public.contributions
  FOR SELECT
  USING (
    is_anonymous = false
    AND payment_status = 'succeeded'
    AND EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND is_published = true
    )
  );

-- Lecture totale par coowners
CREATE POLICY "contributions_select_coowner" ON public.contributions
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- INSERT et UPDATE : gérés UNIQUEMENT par service_role via Server Actions
-- (validation côté app du paiement Mangopay avant écriture)
-- Aucune policy d'insert public : un invité non authentifié ne peut PAS écrire
-- directement en DB. Tout passe par /actions/contributions.ts qui utilise service_role
-- après confirmation Mangopay.

-- =============================================================================
-- POLICIES : wedding_events
-- =============================================================================
CREATE POLICY "wedding_events_select_public" ON public.wedding_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND is_published = true
    )
  );

CREATE POLICY "wedding_events_select_coowner" ON public.wedding_events
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

CREATE POLICY "wedding_events_insert_coowner" ON public.wedding_events
  FOR INSERT
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "wedding_events_update_coowner" ON public.wedding_events
  FOR UPDATE
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "wedding_events_delete_coowner" ON public.wedding_events
  FOR DELETE
  USING (public.is_wedding_coowner(wedding_id));

-- =============================================================================
-- POLICIES : guests
-- =============================================================================
-- Coowners only — jamais public
CREATE POLICY "guests_all_coowner" ON public.guests
  FOR ALL
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

-- L'accès invité au RSVP par token passe par Server Action avec service_role.

-- =============================================================================
-- POLICIES : guest_rsvps
-- =============================================================================
CREATE POLICY "guest_rsvps_all_coowner" ON public.guest_rsvps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = guest_id AND public.is_wedding_coowner(g.wedding_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = guest_id AND public.is_wedding_coowner(g.wedding_id)
    )
  );

-- =============================================================================
-- POLICIES : withdrawals
-- =============================================================================
-- Coowners only, jamais public
CREATE POLICY "withdrawals_select_coowner" ON public.withdrawals
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- INSERT par coowners (avec validation app du montant disponible)
CREATE POLICY "withdrawals_insert_coowner" ON public.withdrawals
  FOR INSERT
  WITH CHECK (public.is_wedding_coowner(wedding_id));

-- UPDATE réservé au service_role (webhooks Mangopay)
-- DELETE jamais autorisé (audit trail)

-- =============================================================================
-- POLICIES : guestbook_messages
-- =============================================================================
-- Lecture publique des messages visibles si wedding publié
CREATE POLICY "guestbook_select_public" ON public.guestbook_messages
  FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.weddings
      WHERE id = wedding_id AND is_published = true
    )
  );

-- Lecture totale par coowners (y compris messages modérés)
CREATE POLICY "guestbook_select_coowner" ON public.guestbook_messages
  FOR SELECT
  USING (public.is_wedding_coowner(wedding_id));

-- Update/delete par coowners (modération)
CREATE POLICY "guestbook_update_coowner" ON public.guestbook_messages
  FOR UPDATE
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "guestbook_delete_coowner" ON public.guestbook_messages
  FOR DELETE
  USING (public.is_wedding_coowner(wedding_id));

-- INSERT par invités anonymes : passe par Server Action avec service_role
-- (validation Turnstile + rate limiting côté app, jamais en DB directe)

-- =============================================================================
-- POLICIES : audit_logs
-- =============================================================================
-- Lecture par le user concerné uniquement
CREATE POLICY "audit_logs_select_self" ON public.audit_logs
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Lecture par admin
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = public.current_user_id() AND role = 'admin'
    )
  );

-- Inserts uniquement par service_role

-- =============================================================================
-- GRANTS — service_role bypass RLS par défaut, on s'assure quand même
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

-- =============================================================================
-- COMMENTAIRES MÉTIER (utile pour la doc Supabase Studio)
-- =============================================================================
COMMENT ON TABLE public.users IS 'Profils utilisateurs. Synced from Clerk via webhook.';
COMMENT ON COLUMN public.users.clerk_user_id IS 'JWT sub from Clerk. Used in RLS via public.clerk_user_id().';
COMMENT ON TABLE public.weddings IS 'Un wedding = un projet de mariage. Owner = créateur, coowners = administrateurs additionnels.';
COMMENT ON COLUMN public.weddings.slug IS 'Identifiant URL public, format kebab-case [a-z0-9-], 3-60 chars.';
COMMENT ON TABLE public.contributions IS 'Paiements reçus. Inserts uniquement via Server Action après confirmation Mangopay.';
COMMENT ON CONSTRAINT amounts_consistent ON public.contributions IS 'gross_amount doit toujours égaler fee_amount + net_amount';
COMMENT ON TABLE public.guests IS 'Invités gérés par le couple. Chaque invité a un rsvp_token unique pour le lien personnalisé.';
COMMENT ON TABLE public.withdrawals IS 'Demandes de retrait. Updates uniquement via webhook Mangopay (service_role).';

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================

-- Migration: colonnes Stripe Connect (remplace Mangopay)
--
-- Architecture : Stripe Connect Express
--   - users.stripe_account_id      → l'ID du compte Express Stripe du couple
--   - weddings.stripe_account_id   → idem, dénormalisé pour les PaymentIntents
--   - contributions.stripe_payment_intent_id → idempotence des webhooks
--   - withdrawals.stripe_payout_id → suivi des payouts Stripe

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_account_id text UNIQUE;

ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text UNIQUE;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS stripe_payout_id text UNIQUE;

-- Index pour lookups webhook (idempotence)
CREATE INDEX IF NOT EXISTS idx_contributions_stripe_pi
  ON public.contributions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawals_stripe_payout
  ON public.withdrawals (stripe_payout_id)
  WHERE stripe_payout_id IS NOT NULL;

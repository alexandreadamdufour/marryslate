-- Suppression des colonnes Mangopay (ancienne stack de paiement, remplacée par Stripe Connect)
DROP INDEX IF EXISTS public.idx_contributions_mangopay_id;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS mangopay_user_id;

ALTER TABLE public.weddings
  DROP COLUMN IF EXISTS mangopay_wallet_id;

ALTER TABLE public.contributions
  DROP COLUMN IF EXISTS mangopay_payment_id;

ALTER TABLE public.withdrawals
  DROP COLUMN IF EXISTS mangopay_payout_id;

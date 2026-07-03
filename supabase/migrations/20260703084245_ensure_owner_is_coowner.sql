-- Bug corrigé : src/actions/wedding.ts L109-112 faisait un 2e INSERT dans
-- wedding_coowners après l'INSERT weddings, sans error handling. Si ce 2e
-- INSERT échouait silencieusement, l'owner devenait invisible via 3 endroits
-- qui font un lookup direct sur wedding_coowners (pas via is_wedding_coowner(),
-- qui lui checke déjà owner_id) : getMyWedding() (src/queries/wedding.ts),
-- le layout racine du dashboard (src/app/(dashboard)/layout.tsx — redirect
-- vers /onboarding en boucle), et setupStripeConnect (src/actions/withdrawals.ts).
--
-- Vérifié le 3 juillet : 0 wedding orphelin actuellement (les 3 weddings en
-- prod ont bien leur ligne wedding_coowners). Pas de backfill nécessaire,
-- seulement le trigger pour garantir l'invariant pour toute création future
-- (createWedding, mais aussi tout futur/alternatif chemin de création :
-- outil admin, script de seed, etc.).

CREATE OR REPLACE FUNCTION public.ensure_owner_is_coowner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER : le trigger doit réussir quel que soit le contexte RLS
  -- de la requête appelante (défense en profondeur, cohérent avec is_wedding_coowner).
  INSERT INTO public.wedding_coowners (wedding_id, user_id)
  VALUES (NEW.id, NEW.owner_id)
  ON CONFLICT (wedding_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_owner_is_coowner
  AFTER INSERT ON public.weddings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_is_coowner();

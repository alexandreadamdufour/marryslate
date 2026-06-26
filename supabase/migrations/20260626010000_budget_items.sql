CREATE TABLE public.budget_items (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    uuid         NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category      text         NOT NULL,
  name          text         NOT NULL,
  estimated_amount numeric(10,2) NOT NULL DEFAULT 0,
  actual_amount    numeric(10,2),
  paid_amount      numeric(10,2) NOT NULL DEFAULT 0,
  vendor        text,
  notes         text,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coowners can manage budget items"
  ON public.budget_items
  FOR ALL
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE INDEX idx_budget_items_wedding_id ON public.budget_items(wedding_id);

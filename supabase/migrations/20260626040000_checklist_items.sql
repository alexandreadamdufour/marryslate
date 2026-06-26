CREATE TYPE checklist_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE public.checklist_items (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id    uuid              NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category      text              NOT NULL,
  title         text              NOT NULL,
  description   text,
  due_date      date,
  is_completed  boolean           NOT NULL DEFAULT false,
  priority      checklist_priority NOT NULL DEFAULT 'medium',
  created_at    timestamptz       NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coowners can manage checklist items"
  ON public.checklist_items FOR ALL
  USING (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE INDEX idx_checklist_items_wedding_id ON public.checklist_items(wedding_id);

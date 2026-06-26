CREATE TYPE seating_table_shape AS ENUM ('round', 'rectangle');

CREATE TABLE public.seating_tables (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid    NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  capacity    int     NOT NULL DEFAULT 8 CHECK (capacity >= 1 AND capacity <= 50),
  shape       seating_table_shape NOT NULL DEFAULT 'round',
  position_x  int     NOT NULL DEFAULT 100,
  position_y  int     NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.seating_assignments (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id    uuid    NOT NULL REFERENCES public.seating_tables(id) ON DELETE CASCADE,
  guest_id    uuid    NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guest_id)
);

CREATE INDEX idx_seating_tables_wedding ON public.seating_tables(wedding_id);
CREATE INDEX idx_seating_assignments_table ON public.seating_assignments(table_id);

ALTER TABLE public.seating_tables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coowners can manage seating_tables"
  ON public.seating_tables FOR ALL
  USING  (public.is_wedding_coowner(wedding_id))
  WITH CHECK (public.is_wedding_coowner(wedding_id));

CREATE POLICY "Coowners can manage seating_assignments"
  ON public.seating_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.seating_tables t
      WHERE t.id = table_id
        AND public.is_wedding_coowner(t.wedding_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.seating_tables t
      WHERE t.id = table_id
        AND public.is_wedding_coowner(t.wedding_id)
    )
  );

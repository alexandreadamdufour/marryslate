ALTER TABLE weddings
  ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- Atomic increment to avoid race conditions under concurrent visits
CREATE OR REPLACE FUNCTION increment_wedding_view_count(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE weddings
  SET view_count = view_count + 1
  WHERE slug = p_slug
    AND is_published = true;
$$;

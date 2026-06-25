ALTER TABLE weddings
  ADD COLUMN access_code text DEFAULT NULL,
  ADD COLUMN access_code_enabled boolean NOT NULL DEFAULT false;

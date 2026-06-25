-- Photo souvenir jointe par l'invité lors de sa contribution
ALTER TABLE contributions ADD COLUMN contributor_photo_url text DEFAULT NULL;

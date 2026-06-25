-- Notre histoire : titre personnalisé + galerie de photos
ALTER TABLE weddings
  ADD COLUMN story_title text DEFAULT NULL,
  ADD COLUMN story_images jsonb DEFAULT NULL;

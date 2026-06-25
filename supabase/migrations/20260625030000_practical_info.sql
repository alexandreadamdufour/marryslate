-- Infos pratiques : lieux, dress code, hébergements
-- Stocké en JSONB sur la table weddings pour éviter une jointure supplémentaire.
ALTER TABLE weddings ADD COLUMN practical_info JSONB DEFAULT NULL;

-- Ensure POS can persist current party size on table sessions.
-- Safe to run multiple times.
ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS current_party_size INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurant_tables_current_party_size_check'
  ) THEN
    ALTER TABLE public.restaurant_tables
      ADD CONSTRAINT restaurant_tables_current_party_size_check
      CHECK (current_party_size IS NULL OR current_party_size > 0);
  END IF;
END $$;

COMMENT ON COLUMN public.restaurant_tables.current_party_size
IS 'Nombre de convives a la table (saisi a l''ouverture POS). Null quand la table est liberee.';

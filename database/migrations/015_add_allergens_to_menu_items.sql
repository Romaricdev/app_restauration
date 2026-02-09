-- Add allergens to menu_items for filtering on the public menu.
-- Values should match ALLERGENS ids in src/lib/constants.ts (e.g. 'gluten', 'lactose').

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

COMMENT ON COLUMN menu_items.allergens IS 'Allergen ids for filtering (e.g. gluten, lactose). See ALLERGENS in constants.';

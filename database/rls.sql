-- ============================================
-- RLS — Restaurant Central
-- Politiques anon SELECT pour lecture publique (app + dashboard sans auth).
-- Exécuter après schema.sql et seed.sql.
-- ============================================

-- RLS est activé par défaut sur Supabase. On autorise anon à lire les tables publiques.
-- DROP IF EXISTS permet de réexécuter ce script sans erreur.

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon USING (true);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT TO anon USING (true);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_addons" ON addons;
CREATE POLICY "anon_select_addons" ON addons FOR SELECT TO anon USING (true);

ALTER TABLE addon_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_addon_categories" ON addon_categories;
CREATE POLICY "anon_select_addon_categories" ON addon_categories FOR SELECT TO anon USING (true);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_menus" ON menus;
CREATE POLICY "anon_select_menus" ON menus FOR SELECT TO anon USING (true);

ALTER TABLE menu_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_menu_products" ON menu_products;
CREATE POLICY "anon_select_menu_products" ON menu_products FOR SELECT TO anon USING (true);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_restaurant_tables" ON restaurant_tables;
CREATE POLICY "anon_select_restaurant_tables" ON restaurant_tables FOR SELECT TO anon USING (true);

ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_halls" ON halls;
CREATE POLICY "anon_select_halls" ON halls FOR SELECT TO anon USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon USING (true);

ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_order_item_addons" ON order_item_addons;
CREATE POLICY "anon_select_order_item_addons" ON order_item_addons FOR SELECT TO anon USING (true);

ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_table_reservations" ON table_reservations;
CREATE POLICY "anon_select_table_reservations" ON table_reservations FOR SELECT TO anon USING (true);

ALTER TABLE hall_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_hall_reservations" ON hall_reservations;
CREATE POLICY "anon_select_hall_reservations" ON hall_reservations FOR SELECT TO anon USING (true);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT TO anon USING (true);

-- ============================================
-- Politiques anon INSERT/UPDATE/DELETE (dashboard sans auth)
-- À restreindre avec auth (admins/staff) plus tard.
-- ============================================

-- Categories
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon USING (true);

-- Menu items
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE TO anon USING (true);

-- Addons
DROP POLICY IF EXISTS "anon_insert_addons" ON addons;
CREATE POLICY "anon_insert_addons" ON addons FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_addons" ON addons;
CREATE POLICY "anon_update_addons" ON addons FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_addons" ON addons;
CREATE POLICY "anon_delete_addons" ON addons FOR DELETE TO anon USING (true);

-- Addon categories
DROP POLICY IF EXISTS "anon_insert_addon_categories" ON addon_categories;
CREATE POLICY "anon_insert_addon_categories" ON addon_categories FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_addon_categories" ON addon_categories;
CREATE POLICY "anon_update_addon_categories" ON addon_categories FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_addon_categories" ON addon_categories;
CREATE POLICY "anon_delete_addon_categories" ON addon_categories FOR DELETE TO anon USING (true);

-- Menus
DROP POLICY IF EXISTS "anon_insert_menus" ON menus;
CREATE POLICY "anon_insert_menus" ON menus FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_menus" ON menus;
CREATE POLICY "anon_update_menus" ON menus FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_menus" ON menus;
CREATE POLICY "anon_delete_menus" ON menus FOR DELETE TO anon USING (true);

-- Menu products
DROP POLICY IF EXISTS "anon_insert_menu_products" ON menu_products;
CREATE POLICY "anon_insert_menu_products" ON menu_products FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_menu_products" ON menu_products;
CREATE POLICY "anon_delete_menu_products" ON menu_products FOR DELETE TO anon USING (true);

-- Restaurant tables
DROP POLICY IF EXISTS "anon_insert_restaurant_tables" ON restaurant_tables;
CREATE POLICY "anon_insert_restaurant_tables" ON restaurant_tables FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_restaurant_tables" ON restaurant_tables;
CREATE POLICY "anon_update_restaurant_tables" ON restaurant_tables FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_restaurant_tables" ON restaurant_tables;
CREATE POLICY "anon_delete_restaurant_tables" ON restaurant_tables FOR DELETE TO anon USING (true);

-- Halls
DROP POLICY IF EXISTS "anon_insert_halls" ON halls;
CREATE POLICY "anon_insert_halls" ON halls FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_halls" ON halls;
CREATE POLICY "anon_update_halls" ON halls FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "anon_delete_halls" ON halls;
CREATE POLICY "anon_delete_halls" ON halls FOR DELETE TO anon USING (true);

-- Orders (POS: insert + update)
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon USING (true);

-- Order items (POS)
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE TO anon USING (true);

-- Order item addons (POS)
DROP POLICY IF EXISTS "anon_insert_order_item_addons" ON order_item_addons;
CREATE POLICY "anon_insert_order_item_addons" ON order_item_addons FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_order_item_addons" ON order_item_addons;
CREATE POLICY "anon_delete_order_item_addons" ON order_item_addons FOR DELETE TO anon USING (true);

-- Table reservations
DROP POLICY IF EXISTS "anon_insert_table_reservations" ON table_reservations;
CREATE POLICY "anon_insert_table_reservations" ON table_reservations FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_table_reservations" ON table_reservations;
CREATE POLICY "anon_update_table_reservations" ON table_reservations FOR UPDATE TO anon USING (true);

-- Hall reservations
DROP POLICY IF EXISTS "anon_insert_hall_reservations" ON hall_reservations;
CREATE POLICY "anon_insert_hall_reservations" ON hall_reservations FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hall_reservations" ON hall_reservations;
CREATE POLICY "anon_update_hall_reservations" ON hall_reservations FOR UPDATE TO anon USING (true);

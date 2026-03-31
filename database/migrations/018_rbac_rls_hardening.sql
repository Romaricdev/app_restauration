-- ============================================
-- RBAC RLS hardening for dashboard modules
-- ============================================

-- Ensure RLS enabled on RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- RBAC table read policies
DROP POLICY IF EXISTS "auth_read_roles" ON roles;
CREATE POLICY "auth_read_roles" ON roles
  FOR SELECT TO authenticated
  USING (public.has_permission('roles.read'));

DROP POLICY IF EXISTS "auth_manage_roles" ON roles;
CREATE POLICY "auth_manage_roles" ON roles
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['roles.create', 'roles.update', 'roles.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['roles.create', 'roles.update', 'roles.delete']));

DROP POLICY IF EXISTS "auth_read_permissions" ON permissions;
CREATE POLICY "auth_read_permissions" ON permissions
  FOR SELECT TO authenticated
  USING (public.has_permission('roles.read'));

DROP POLICY IF EXISTS "auth_read_role_permissions" ON role_permissions;
CREATE POLICY "auth_read_role_permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (public.has_permission('roles.read'));

DROP POLICY IF EXISTS "auth_manage_role_permissions" ON role_permissions;
CREATE POLICY "auth_manage_role_permissions" ON role_permissions
  FOR ALL TO authenticated
  USING (public.has_permission('roles.assign'))
  WITH CHECK (public.has_permission('roles.assign'));

DROP POLICY IF EXISTS "auth_read_admin_roles" ON admin_roles;
CREATE POLICY "auth_read_admin_roles" ON admin_roles
  FOR SELECT TO authenticated
  USING (public.has_permission('roles.read'));

DROP POLICY IF EXISTS "auth_manage_admin_roles" ON admin_roles;
CREATE POLICY "auth_manage_admin_roles" ON admin_roles
  FOR ALL TO authenticated
  USING (public.has_permission('roles.assign'))
  WITH CHECK (public.has_permission('roles.assign'));

-- Admin table policies aligned to RBAC
DROP POLICY IF EXISTS "authenticated_read_own_admin" ON admins;
DROP POLICY IF EXISTS "authenticated_update_own_login" ON admins;

DROP POLICY IF EXISTS "auth_read_admins" ON admins;
CREATE POLICY "auth_read_admins" ON admins
  FOR SELECT TO authenticated
  USING (
    public.has_permission('admins.read')
    OR id = public.current_admin_id()
  );

DROP POLICY IF EXISTS "auth_manage_admins" ON admins;
CREATE POLICY "auth_manage_admins" ON admins
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['admins.create', 'admins.update', 'admins.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['admins.create', 'admins.update', 'admins.delete']));

-- App settings: read/write through dedicated permissions
DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;

DROP POLICY IF EXISTS "auth_read_app_settings" ON app_settings;
CREATE POLICY "auth_read_app_settings" ON app_settings
  FOR SELECT TO authenticated
  USING (public.has_permission('settings.read'));

DROP POLICY IF EXISTS "auth_update_app_settings" ON app_settings;
CREATE POLICY "auth_update_app_settings" ON app_settings
  FOR ALL TO authenticated
  USING (public.has_permission('settings.update'))
  WITH CHECK (public.has_permission('settings.update'));

-- Restrict dashboard write operations to authenticated + permission
-- Keep anon SELECT policies for public pages where needed.

-- Categories
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
DROP POLICY IF EXISTS "auth_manage_categories" ON categories;
CREATE POLICY "auth_manage_categories" ON categories
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['categories.create', 'categories.update', 'categories.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['categories.create', 'categories.update', 'categories.delete']));

-- Menu items / products
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
DROP POLICY IF EXISTS "auth_manage_menu_items" ON menu_items;
CREATE POLICY "auth_manage_menu_items" ON menu_items
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['products.create', 'products.update', 'products.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['products.create', 'products.update', 'products.delete']));

-- Addons
DROP POLICY IF EXISTS "anon_insert_addons" ON addons;
DROP POLICY IF EXISTS "anon_update_addons" ON addons;
DROP POLICY IF EXISTS "anon_delete_addons" ON addons;
DROP POLICY IF EXISTS "auth_manage_addons" ON addons;
CREATE POLICY "auth_manage_addons" ON addons
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['addons.create', 'addons.update', 'addons.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['addons.create', 'addons.update', 'addons.delete']));

DROP POLICY IF EXISTS "anon_insert_addon_categories" ON addon_categories;
DROP POLICY IF EXISTS "anon_update_addon_categories" ON addon_categories;
DROP POLICY IF EXISTS "anon_delete_addon_categories" ON addon_categories;
DROP POLICY IF EXISTS "auth_manage_addon_categories" ON addon_categories;
CREATE POLICY "auth_manage_addon_categories" ON addon_categories
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['addons.create', 'addons.update', 'addons.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['addons.create', 'addons.update', 'addons.delete']));

-- Menus and menu products
DROP POLICY IF EXISTS "anon_insert_menus" ON menus;
DROP POLICY IF EXISTS "anon_update_menus" ON menus;
DROP POLICY IF EXISTS "anon_delete_menus" ON menus;
DROP POLICY IF EXISTS "auth_manage_menus" ON menus;
CREATE POLICY "auth_manage_menus" ON menus
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['menus.create', 'menus.update', 'menus.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['menus.create', 'menus.update', 'menus.delete']));

DROP POLICY IF EXISTS "anon_insert_menu_products" ON menu_products;
DROP POLICY IF EXISTS "anon_delete_menu_products" ON menu_products;
DROP POLICY IF EXISTS "auth_manage_menu_products" ON menu_products;
CREATE POLICY "auth_manage_menu_products" ON menu_products
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['menus.create', 'menus.update', 'menus.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['menus.create', 'menus.update', 'menus.delete']));

-- Tables
DROP POLICY IF EXISTS "anon_insert_restaurant_tables" ON restaurant_tables;
DROP POLICY IF EXISTS "anon_update_restaurant_tables" ON restaurant_tables;
DROP POLICY IF EXISTS "anon_delete_restaurant_tables" ON restaurant_tables;
DROP POLICY IF EXISTS "auth_manage_restaurant_tables" ON restaurant_tables;
CREATE POLICY "auth_manage_restaurant_tables" ON restaurant_tables
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['tables.create', 'tables.update', 'tables.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['tables.create', 'tables.update', 'tables.delete']));

-- Halls
DROP POLICY IF EXISTS "anon_insert_halls" ON halls;
DROP POLICY IF EXISTS "anon_update_halls" ON halls;
DROP POLICY IF EXISTS "anon_delete_halls" ON halls;
DROP POLICY IF EXISTS "auth_manage_halls" ON halls;
CREATE POLICY "auth_manage_halls" ON halls
  FOR ALL TO authenticated
  USING (public.has_any_permission(ARRAY['halls.create', 'halls.update', 'halls.delete']))
  WITH CHECK (public.has_any_permission(ARRAY['halls.create', 'halls.update', 'halls.delete']));

-- Orders: keep anon insert for public checkout, restrict update/delete to authenticated RBAC users
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "auth_manage_orders" ON orders;
CREATE POLICY "auth_manage_orders" ON orders
  FOR UPDATE TO authenticated
  USING (public.has_any_permission(ARRAY['orders.update', 'orders.confirm', 'orders.cancel', 'orders.pay']))
  WITH CHECK (public.has_any_permission(ARRAY['orders.update', 'orders.confirm', 'orders.cancel', 'orders.pay']));

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders
  FOR DELETE TO authenticated
  USING (public.has_permission('orders.delete'));


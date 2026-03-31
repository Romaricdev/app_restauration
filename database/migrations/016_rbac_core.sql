-- ============================================
-- RBAC Core: roles, permissions, assignments
-- ============================================

-- 1) Extend admins with stable auth link
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS auth_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admins_auth_user_id_fkey'
  ) THEN
    ALTER TABLE admins
      ADD CONSTRAINT admins_auth_user_id_fkey
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_auth_user_id_unique
  ON admins(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Backfill auth_user_id from email when possible
UPDATE admins a
SET auth_user_id = u.id
FROM auth.users u
WHERE a.auth_user_id IS NULL
  AND lower(a.email) = lower(u.email);

-- 2) RBAC entities
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,            -- ex: orders.read
  module TEXT NOT NULL,                 -- ex: orders
  action TEXT NOT NULL,                 -- ex: read
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_roles (
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_admin ON admin_roles(admin_id);

-- 3) updated_at trigger for roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_roles_updated_at'
    ) THEN
      CREATE TRIGGER tr_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW
        EXECUTE PROCEDURE set_updated_at();
    END IF;
  END IF;
END $$;

-- 4) Seed system roles
INSERT INTO roles (code, label, description, is_system)
VALUES
  ('super_admin', 'Super Admin', 'Accès complet à tous les modules et actions', true),
  ('admin', 'Admin', 'Administration opérationnelle complète', true),
  ('manager', 'Manager', 'Pilotage opérationnel sans administration système', true),
  ('staff', 'Staff', 'Accès limité aux opérations quotidiennes', true)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;

-- 5) Seed permissions (module.action)
WITH perms(code, module, action, description) AS (
  VALUES
    ('dashboard.read', 'dashboard', 'read', 'Voir la vue d''ensemble'),
    ('pos.read', 'pos', 'read', 'Accéder au POS'),
    ('orders.read', 'orders', 'read', 'Voir les commandes'),
    ('orders.create', 'orders', 'create', 'Créer des commandes'),
    ('orders.update', 'orders', 'update', 'Modifier des commandes'),
    ('orders.delete', 'orders', 'delete', 'Supprimer des commandes'),
    ('orders.confirm', 'orders', 'confirm', 'Confirmer des commandes'),
    ('orders.cancel', 'orders', 'cancel', 'Annuler des commandes'),
    ('orders.pay', 'orders', 'pay', 'Enregistrer un paiement'),
    ('orders.export', 'orders', 'export', 'Exporter les commandes'),
    ('products.read', 'products', 'read', 'Voir les produits'),
    ('products.create', 'products', 'create', 'Créer des produits'),
    ('products.update', 'products', 'update', 'Modifier des produits'),
    ('products.delete', 'products', 'delete', 'Supprimer des produits'),
    ('categories.read', 'categories', 'read', 'Voir les catégories'),
    ('categories.create', 'categories', 'create', 'Créer des catégories'),
    ('categories.update', 'categories', 'update', 'Modifier des catégories'),
    ('categories.delete', 'categories', 'delete', 'Supprimer des catégories'),
    ('menus.read', 'menus', 'read', 'Voir les menus'),
    ('menus.create', 'menus', 'create', 'Créer des menus'),
    ('menus.update', 'menus', 'update', 'Modifier des menus'),
    ('menus.delete', 'menus', 'delete', 'Supprimer des menus'),
    ('tables.read', 'tables', 'read', 'Voir les tables'),
    ('tables.create', 'tables', 'create', 'Créer des tables'),
    ('tables.update', 'tables', 'update', 'Modifier des tables'),
    ('tables.delete', 'tables', 'delete', 'Supprimer des tables'),
    ('halls.read', 'halls', 'read', 'Voir les salles'),
    ('halls.create', 'halls', 'create', 'Créer des salles'),
    ('halls.update', 'halls', 'update', 'Modifier des salles'),
    ('halls.delete', 'halls', 'delete', 'Supprimer des salles'),
    ('reservation_halls.read', 'reservation_halls', 'read', 'Voir les réservations de salles'),
    ('reservation_halls.create', 'reservation_halls', 'create', 'Créer des réservations de salles'),
    ('reservation_halls.update', 'reservation_halls', 'update', 'Modifier des réservations de salles'),
    ('reservation_halls.delete', 'reservation_halls', 'delete', 'Supprimer des réservations de salles'),
    ('reservations.read', 'reservations', 'read', 'Voir les réservations'),
    ('reservations.create', 'reservations', 'create', 'Créer des réservations'),
    ('reservations.update', 'reservations', 'update', 'Modifier des réservations'),
    ('reservations.delete', 'reservations', 'delete', 'Supprimer des réservations'),
    ('addons.read', 'addons', 'read', 'Voir les addons'),
    ('addons.create', 'addons', 'create', 'Créer des addons'),
    ('addons.update', 'addons', 'update', 'Modifier des addons'),
    ('addons.delete', 'addons', 'delete', 'Supprimer des addons'),
    ('settings.read', 'settings', 'read', 'Voir les paramètres'),
    ('settings.update', 'settings', 'update', 'Modifier les paramètres'),
    ('help.read', 'help', 'read', 'Voir la documentation interne'),
    ('admins.read', 'admins', 'read', 'Voir les admins'),
    ('admins.create', 'admins', 'create', 'Créer des admins'),
    ('admins.update', 'admins', 'update', 'Modifier des admins'),
    ('admins.delete', 'admins', 'delete', 'Supprimer des admins'),
    ('roles.read', 'roles', 'read', 'Voir les rôles'),
    ('roles.create', 'roles', 'create', 'Créer des rôles'),
    ('roles.update', 'roles', 'update', 'Modifier des rôles'),
    ('roles.delete', 'roles', 'delete', 'Supprimer des rôles'),
    ('roles.assign', 'roles', 'assign', 'Assigner les rôles et permissions')
)
INSERT INTO permissions (code, module, action, description)
SELECT code, module, action, description
FROM perms
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

-- 6) Role -> permission grants
-- super_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin: all except admins.* and roles.*
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
WHERE r.code = 'admin'
  AND p.module NOT IN ('admins', 'roles')
ON CONFLICT DO NOTHING;

-- manager: broad operations, no settings/admins/roles delete-heavy operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
WHERE r.code = 'manager'
  AND p.code IN (
    'dashboard.read',
    'pos.read',
    'orders.read', 'orders.create', 'orders.update', 'orders.confirm', 'orders.cancel', 'orders.pay',
    'products.read', 'products.create', 'products.update',
    'categories.read', 'categories.create', 'categories.update',
    'menus.read', 'menus.create', 'menus.update',
    'tables.read', 'tables.update',
    'halls.read', 'halls.create', 'halls.update',
    'reservation_halls.read', 'reservation_halls.create', 'reservation_halls.update',
    'reservations.read', 'reservations.create', 'reservations.update',
    'addons.read', 'addons.create', 'addons.update',
    'help.read'
  )
ON CONFLICT DO NOTHING;

-- staff: focused operational access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
WHERE r.code = 'staff'
  AND p.code IN (
    'pos.read',
    'orders.read', 'orders.update', 'orders.confirm', 'orders.cancel', 'orders.pay',
    'tables.read', 'tables.update',
    'reservations.read',
    'help.read'
  )
ON CONFLICT DO NOTHING;

-- 7) Initial admin role assignments (backfill)
-- super admin flag wins
INSERT INTO admin_roles (admin_id, role_id)
SELECT a.id, r.id
FROM admins a
JOIN roles r ON r.code = 'super_admin'
WHERE a.is_super_admin = true
ON CONFLICT DO NOTHING;

-- Others default to admin (if no role assigned yet)
INSERT INTO admin_roles (admin_id, role_id)
SELECT a.id, r.id
FROM admins a
JOIN roles r ON r.code = 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM admin_roles ar WHERE ar.admin_id = a.id
)
ON CONFLICT DO NOTHING;

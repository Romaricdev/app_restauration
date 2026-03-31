-- ============================================
-- Seed: super_admin with full permissions
-- ============================================
-- IMPORTANT:
-- 1) Create the auth user first in Supabase Authentication.
-- 2) Update v_email and v_name below before running.

DO $$
DECLARE
  v_email TEXT := 'superadmin@mindef.local';
  v_name TEXT := 'Super Admin';
  v_auth_user_id UUID;
  v_admin_id UUID;
  v_super_role_id UUID;
BEGIN
  -- Resolve auth user by email.
  SELECT u.id
  INTO v_auth_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(v_email)
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION
      'Auth user "%" not found in auth.users. Create it first, then re-run this seed.',
      v_email;
  END IF;

  -- Upsert admin profile as super admin.
  INSERT INTO admins (name, email, auth_user_id, is_super_admin, permissions)
  VALUES (v_name, v_email, v_auth_user_id, true, '["*"]'::jsonb)
  ON CONFLICT (email) DO UPDATE
  SET
    name = EXCLUDED.name,
    auth_user_id = EXCLUDED.auth_user_id,
    is_super_admin = true,
    permissions = '["*"]'::jsonb,
    updated_at = now()
  RETURNING id INTO v_admin_id;

  -- Ensure super_admin role exists.
  SELECT r.id
  INTO v_super_role_id
  FROM roles r
  WHERE r.code = 'super_admin'
  LIMIT 1;

  IF v_super_role_id IS NULL THEN
    RAISE EXCEPTION
      'Role "super_admin" not found. Run RBAC core migration first.';
  END IF;

  -- Assign the super_admin role to this admin.
  INSERT INTO admin_roles (admin_id, role_id)
  VALUES (v_admin_id, v_super_role_id)
  ON CONFLICT DO NOTHING;

  -- Guarantee super_admin role has all permissions.
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_role_id, p.id
  FROM permissions p
  ON CONFLICT DO NOTHING;
END $$;

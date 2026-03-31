-- ============================================
-- RBAC helper functions + create_admin upgrade
-- ============================================

CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM admins a
  WHERE
    (a.auth_user_id IS NOT NULL AND a.auth_user_id = auth.uid())
    OR lower(a.email) = lower(auth.jwt() ->> 'email')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(p_role_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admins a
    LEFT JOIN admin_roles ar ON ar.admin_id = a.id
    LEFT JOIN roles r ON r.id = ar.role_id
    WHERE (
      (a.auth_user_id IS NOT NULL AND a.auth_user_id = auth.uid())
      OR lower(a.email) = lower(auth.jwt() ->> 'email')
    )
    AND (
      a.is_super_admin = true
      OR r.code = p_role_code
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admins a
    LEFT JOIN admin_roles ar ON ar.admin_id = a.id
    LEFT JOIN role_permissions rp ON rp.role_id = ar.role_id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE (
      (a.auth_user_id IS NOT NULL AND a.auth_user_id = auth.uid())
      OR lower(a.email) = lower(auth.jwt() ->> 'email')
    )
    AND (
      a.is_super_admin = true
      OR p.code = p_permission_code
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_permission(p_permission_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(p_permission_codes) AS code
    WHERE public.has_permission(code)
  );
$$;

-- Upgrade create_admin helper to assign auth_user_id + role
CREATE OR REPLACE FUNCTION public.create_admin(
  p_name TEXT,
  p_email TEXT,
  p_is_super_admin BOOLEAN DEFAULT false,
  p_permissions JSONB DEFAULT '[]'::jsonb,
  p_role_code TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'L''utilisateur avec l''email ' || p_email || ' n''existe pas dans auth.users. Veuillez d''abord créer le compte Supabase Auth.'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM admins WHERE lower(email) = lower(p_email)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Un admin avec l''email ' || p_email || ' existe déjà.'
    );
  END IF;

  INSERT INTO admins (name, email, auth_user_id, is_super_admin, permissions)
  VALUES (p_name, p_email, v_user_id, p_is_super_admin, p_permissions)
  RETURNING id INTO v_admin_id;

  SELECT id INTO v_role_id FROM roles WHERE code = p_role_code LIMIT 1;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE code = 'admin' LIMIT 1;
  END IF;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO admin_roles (admin_id, role_id)
    VALUES (v_admin_id, v_role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'admin_id', v_admin_id,
    'auth_user_id', v_user_id,
    'role', COALESCE(p_role_code, 'admin'),
    'message', 'Admin créé avec succès'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_admin_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_permission(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_any_permission(TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_admin(TEXT, TEXT, BOOLEAN, JSONB, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_permission(TEXT[]) TO authenticated;

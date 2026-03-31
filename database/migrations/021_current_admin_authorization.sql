-- ============================================
-- Current admin authorization snapshot
-- ============================================

CREATE OR REPLACE FUNCTION public.current_admin_authorization()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_is_super_admin BOOLEAN := false;
  v_role_codes TEXT[] := ARRAY[]::TEXT[];
  v_permission_codes TEXT[] := ARRAY[]::TEXT[];
  v_dashboard_role TEXT := 'utilisateur';
BEGIN
  SELECT a.id, COALESCE(a.is_super_admin, false)
  INTO v_admin_id, v_is_super_admin
  FROM admins a
  WHERE
    (a.auth_user_id IS NOT NULL AND a.auth_user_id = auth.uid())
    OR lower(a.email) = lower(auth.jwt() ->> 'email')
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'roles', ARRAY[]::TEXT[],
      'permissions', ARRAY[]::TEXT[],
      'dashboard_role', 'utilisateur',
      'is_super_admin', false
    );
  END IF;

  IF v_is_super_admin THEN
    SELECT COALESCE(array_agg(p.code ORDER BY p.code), ARRAY[]::TEXT[])
    INTO v_permission_codes
    FROM permissions p;

    RETURN jsonb_build_object(
      'roles', ARRAY['super_admin']::TEXT[],
      'permissions', v_permission_codes,
      'dashboard_role', 'super_admin',
      'is_super_admin', true
    );
  END IF;

  SELECT COALESCE(array_agg(DISTINCT r.code ORDER BY r.code), ARRAY[]::TEXT[])
  INTO v_role_codes
  FROM admin_roles ar
  JOIN roles r ON r.id = ar.role_id
  WHERE ar.admin_id = v_admin_id;

  SELECT COALESCE(array_agg(DISTINCT p.code ORDER BY p.code), ARRAY[]::TEXT[])
  INTO v_permission_codes
  FROM admin_roles ar
  JOIN role_permissions rp ON rp.role_id = ar.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ar.admin_id = v_admin_id;

  SELECT r.code
  INTO v_dashboard_role
  FROM admin_roles ar
  JOIN roles r ON r.id = ar.role_id
  WHERE ar.admin_id = v_admin_id
  ORDER BY ar.created_at ASC
  LIMIT 1;

  IF v_dashboard_role IS NULL OR v_dashboard_role = '' THEN
    v_dashboard_role := COALESCE(v_role_codes[1], 'utilisateur');
  END IF;

  RETURN jsonb_build_object(
    'roles', v_role_codes,
    'permissions', v_permission_codes,
    'dashboard_role', v_dashboard_role,
    'is_super_admin', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_admin_authorization() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_admin_authorization() TO authenticated;

-- ============================================
-- Create admin + auth user in one step
-- ============================================

CREATE OR REPLACE FUNCTION public.create_admin_with_password(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_is_super_admin BOOLEAN DEFAULT false,
  p_role_code TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
  v_role_id UUID;
  v_auth_user_id UUID;
  v_admin_id UUID;
BEGIN
  IF NOT public.has_permission('admins.create') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission admins.create requise.');
  END IF;

  v_email := lower(trim(p_email));

  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email obligatoire.');
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nom obligatoire.');
  END IF;

  IF p_password IS NULL OR length(p_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mot de passe invalide (min 8 caracteres).');
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Un utilisateur auth avec cet email existe deja.'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM admins a WHERE lower(a.email) = v_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Un admin avec cet email existe deja.'
    );
  END IF;

  PERFORM auth.admin_create_user(
    email => v_email,
    password => p_password,
    email_confirm => true,
    user_metadata => jsonb_build_object('full_name', trim(p_name))
  );

  SELECT u.id
  INTO v_auth_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Creation auth users echouee.';
  END IF;

  INSERT INTO admins (name, email, auth_user_id, is_super_admin, permissions)
  VALUES (trim(p_name), v_email, v_auth_user_id, p_is_super_admin, '[]'::jsonb)
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
    'auth_user_id', v_auth_user_id,
    'email', v_email,
    'message', 'Utilisateur admin cree avec succes'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_with_password(TEXT, TEXT, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_with_password(TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

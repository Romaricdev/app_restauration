-- ============================================
-- Fonction helper pour créer un admin
-- ============================================

-- Fonction pour créer un admin après que le compte Supabase Auth existe
-- Cette fonction vérifie que l'utilisateur existe dans auth.users avant d'insérer dans admins
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
  -- Vérifier si l'utilisateur existe dans auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  -- Si l'utilisateur n'existe pas, retourner une erreur
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'L''utilisateur avec l''email ' || p_email || ' n''existe pas dans auth.users. Veuillez d''abord créer le compte Supabase Auth.'
    );
  END IF;

  -- Vérifier si l'admin existe déjà
  IF EXISTS (SELECT 1 FROM admins WHERE lower(email) = lower(p_email)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Un admin avec l''email ' || p_email || ' existe déjà.'
    );
  END IF;

  -- Insérer dans admins
  INSERT INTO admins (name, email, auth_user_id, is_super_admin, permissions)
  VALUES (p_name, p_email, v_user_id, p_is_super_admin, p_permissions)
  RETURNING id INTO v_admin_id;

  -- Assigner un rôle RBAC si les tables existent
  SELECT id INTO v_role_id
  FROM roles
  WHERE code = p_role_code
  LIMIT 1;

  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id
    FROM roles
    WHERE code = 'admin'
    LIMIT 1;
  END IF;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO admin_roles (admin_id, role_id)
    VALUES (v_admin_id, v_role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mettre à jour last_login_at (optionnel, peut être null au début)
  -- UPDATE admins SET last_login_at = now() WHERE id = v_admin_id;

  RETURN jsonb_build_object(
    'success', true,
    'admin_id', v_admin_id,
    'auth_user_id', v_user_id,
    'role', COALESCE(p_role_code, 'admin'),
    'message', 'Admin créé avec succès'
  );
END;
$$;

-- ============================================
-- Exemple d'utilisation :
-- ============================================
-- 
-- ÉTAPE 1 : Créer le compte Supabase Auth (via Dashboard ou API)
--   - Aller dans Supabase Dashboard > Authentication > Users
--   - Cliquer sur "Add user" > "Create new user"
--   - Entrer l'email et le mot de passe
--   - OU utiliser l'API :
--     POST /auth/v1/admin/users
--     {
--       "email": "admin@example.com",
--       "password": "motdepasse123",
--       "email_confirm": true
--     }
--
-- ÉTAPE 2 : Exécuter la fonction SQL pour créer l'admin
--   SELECT public.create_admin(
--     'Nom Admin',                    -- nom de l'admin
--     'admin@example.com',            -- email (DOIT correspondre à auth.users)
--     true,                           -- is_super_admin
--     '["orders", "menus", "settings"]'::jsonb  -- permissions (optionnel)
--   );
--
-- ============================================

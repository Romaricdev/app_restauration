# Système d'Authentification - Restaurant Central

## Vue d'ensemble

Le système d'authentification est maintenant **entièrement fonctionnel** avec Supabase Auth. Il permet :
- ✅ Inscription de nouveaux utilisateurs
- ✅ Connexion avec email/mot de passe
- ✅ Gestion des sessions
- ✅ Protection des routes dashboard
- ✅ Déconnexion
- ✅ Création automatique de profil utilisateur

---

## Architecture

### 1. Store Zustand (`src/store/auth-store.ts`)

Gère l'état global de l'authentification :
- `user` : Utilisateur connecté (type `User`)
- `supabaseUser` : Utilisateur Supabase Auth
- `loading` : État de chargement
- `initialized` : État d'initialisation

**Actions disponibles :**
- `signIn(email, password)` : Connexion
- `signUp(email, password, fullName)` : Inscription
- `signOut()` : Déconnexion
- `initialize()` : Initialisation de l'auth au démarrage
- `refreshSession()` : Rafraîchissement de la session

### 2. Hooks personnalisés (`src/hooks/useAuth.ts`)

**`useAuth()`** : Hook principal pour utiliser l'authentification
```typescript
const { user, isAuthenticated, signIn, signUp, signOut } = useAuth()
```

**`useRequireAuth(redirectTo?)`** : Protège une route - redirige vers `/login` si non authentifié
```typescript
const { user, loading, isAuthenticated } = useRequireAuth()
```

**`useRequireAdmin(redirectTo?)`** : Protège une route admin - redirige si l'utilisateur n'est pas admin/manager
```typescript
const { user, loading, isAuthenticated, isAdmin } = useRequireAdmin()
```

### 3. AuthProvider (`src/components/auth/AuthProvider.tsx`)

Provider qui initialise automatiquement l'authentification au niveau de l'application. Déjà intégré dans `src/app/layout.tsx`.

### 4. Formulaires connectés

- **LoginForm** : Connecté à `signIn()` de Supabase
- **RegisterForm** : Connecté à `signUp()` de Supabase avec création automatique de profil

---

## Configuration Supabase

### 1. Variables d'environnement

Créer un fichier `.env.local` avec :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### 2. Base de données

#### Schéma de la table `profiles`

La table `profiles` doit être créée avec :
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Schéma de la table `admins` (séparée)

La table `admins` est **séparée** de `profiles` et contient les administrateurs de la plateforme :
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB DEFAULT '[]',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Note :** Les admins utilisent aussi Supabase Auth (ils ont un compte dans `auth.users`), mais leur profil est dans `admins` au lieu de `profiles`. Le système vérifie d'abord si l'email existe dans `admins` lors de la connexion.

#### Politiques RLS pour la table `admins` (OBLIGATOIRE)

**⚠️ IMPORTANT :** Vous devez exécuter la migration `database/migrations/007_admins_rls.sql` pour que l'authentification fonctionne. Sans cette migration, les utilisateurs ne pourront pas vérifier s'ils sont admin et le dashboard restera bloqué sur le loader.

Cette migration crée des politiques RLS qui permettent aux utilisateurs authentifiés de :
- Lire leur propre enregistrement dans `admins` (pour vérifier s'ils sont admin)
- Mettre à jour leur `last_login_at`

```sql
-- Exécuter dans Supabase SQL Editor :
-- Copier/coller le contenu de database/migrations/007_admins_rls.sql
```

#### Trigger automatique

Exécuter la migration `database/migrations/005_create_profile_trigger.sql` pour créer automatiquement un profil lors de l'inscription :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Création d'un administrateur

Les administrateurs doivent être créés **manuellement** car ils sont dans une table séparée.

### Méthode recommandée (avec fonction helper)

1. **Exécuter les migrations** :
   - `database/migrations/006_create_admin_helper.sql` : Fonction helper pour créer un admin
   - `database/migrations/007_admins_rls.sql` : **OBLIGATOIRE** - Politiques RLS pour la table `admins`
2. **Créer le compte Supabase Auth** (voir ci-dessous)
3. **Exécuter la fonction SQL** :
```sql
SELECT public.create_admin(
  'Nom de l''Administrateur',        -- nom de l'admin
  'admin@example.com',               -- email (DOIT correspondre au compte Auth)
  true,                               -- true = super admin, false = admin limité
  '["orders", "menus", "settings"]'::jsonb  -- permissions (optionnel)
);
```

### Méthode alternative (insertion directe)

Si vous préférez insérer directement :
```sql
INSERT INTO admins (name, email, is_super_admin, permissions)
VALUES (
  'Nom de l''admin',
  'admin@example.com',  -- DOIT correspondre à l'email du compte Supabase Auth
  true,
  '["orders", "menus", "settings"]'::jsonb
);
```

### Créer le compte Supabase Auth

**Méthode 1 : Via le Dashboard Supabase** (le plus simple)
1. Aller dans Supabase Dashboard > Authentication > Users
2. Cliquer sur "Add user" > "Create new user"
3. Entrer :
   - Email : `admin@example.com`
   - Password : [mot de passe sécurisé]
   - Auto Confirm User : ✅ (cocher)
4. Cliquer sur "Create user"

**Méthode 2 : Via l'API Supabase**
```bash
curl -X POST 'https://[VOTRE-PROJECT].supabase.co/auth/v1/admin/users' \
  -H "apikey: [VOTRE-SERVICE-ROLE-KEY]" \
  -H "Authorization: Bearer [VOTRE-SERVICE-ROLE-KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MotDePasse123!",
    "email_confirm": true
  }'
```

**Méthode 3 : Via Supabase CLI**
```bash
supabase auth admin create-user \
  --email admin@example.com \
  --password "MotDePasse123!" \
  --email-confirm
```

### Script complet

Voir le fichier `database/scripts/create_admin.sql` pour un script complet avec toutes les instructions détaillées.

**Important :** 
- L'`email` dans `admins` doit **correspondre exactement** à l'`email` du compte dans `auth.users` de Supabase
- L'`id` dans `admins` est généré automatiquement (UUID) et n'a pas besoin de correspondre à l'`id` de `auth.users`
- La correspondance se fait par **email** lors de la connexion
- La fonction `create_admin()` vérifie automatiquement que le compte Auth existe avant d'insérer dans `admins`

---

## Utilisation

### Connexion

1. L'utilisateur va sur `/login`
2. Remplit le formulaire (email + mot de passe)
3. Clique sur "Se connecter"
4. Le système vérifie :
   - **D'abord** si l'email existe dans la table `admins`
   - **Sinon** cherche dans la table `profiles`
5. Redirection automatique :
   - **Admin** (table `admins`) → `/dashboard`
   - **Client** (table `profiles`) → `/home`

### Inscription

1. L'utilisateur va sur `/register`
2. Remplit le formulaire (nom, email, mot de passe, confirmation)
3. Clique sur "Créer un compte"
4. Un profil est créé automatiquement avec le rôle `customer`
5. Redirection vers `/home`

### Protection des routes

Le dashboard est protégé automatiquement via `useRequireAdmin()` dans `src/app/dashboard/layout.tsx`.

**Seuls les utilisateurs avec `role === 'admin'` (de la table `admins`) peuvent accéder au dashboard.**

Pour protéger d'autres routes :
```typescript
'use client'
import { useRequireAuth } from '@/hooks/useAuth'

export default function ProtectedPage() {
  const { user, loading } = useRequireAuth()
  
  if (loading) return <div>Chargement...</div>
  
  return <div>Contenu protégé</div>
}
```

### Déconnexion

- **Dashboard** : Menu utilisateur en haut à droite → "Déconnexion"
- **Site public** : Header → Bouton "Déconnexion" (si connecté)

---

## Rôles utilisateurs

Les rôles disponibles sont définis dans `src/types/index.ts` :
- `admin` : Administrateur (accès complet au dashboard) - **Stocké dans la table `admins` séparée**
- `manager` : Gestionnaire (accès dashboard) - Stocké dans `profiles`
- `staff` : Personnel (accès dashboard) - Stocké dans `profiles`
- `customer` : Client (accès site public uniquement) - Stocké dans `profiles`

**Important :** Les administrateurs sont gérés dans une table séparée `admins` et non dans `profiles`. Lors de la connexion, le système vérifie d'abord si l'email existe dans `admins` avant de chercher dans `profiles`.

---

## Gestion des erreurs

Les formulaires affichent des messages d'erreur explicites :
- "Email ou mot de passe incorrect"
- "Cet email est déjà utilisé"
- "Le mot de passe ne respecte pas les critères requis"
- etc.

---

## Sécurité

- ✅ Mots de passe hashés par Supabase
- ✅ Sessions gérées par Supabase Auth
- ✅ Tokens JWT automatiques
- ✅ Protection CSRF intégrée
- ✅ Validation côté client et serveur
- ✅ RLS (Row Level Security) à configurer dans Supabase

---

## Prochaines étapes (optionnel)

- [ ] Ajouter la réinitialisation de mot de passe
- [ ] Ajouter la confirmation d'email
- [ ] Ajouter l'authentification OAuth (Google, Facebook)
- [ ] Configurer les politiques RLS dans Supabase
- [ ] Ajouter la gestion des permissions granulaires

---

## Fichiers créés/modifiés

### Nouveaux fichiers
- `src/store/auth-store.ts` - Store Zustand pour l'auth
- `src/hooks/useAuth.ts` - Hooks personnalisés
- `src/components/auth/AuthProvider.tsx` - Provider d'authentification
- `database/migrations/005_create_profile_trigger.sql` - Trigger SQL

### Fichiers modifiés
- `src/components/auth/LoginForm.tsx` - Connecté à Supabase
- `src/components/auth/RegisterForm.tsx` - Connecté à Supabase
- `src/components/layout/dashboard/topbar.tsx` - Affichage utilisateur + déconnexion
- `src/components/layout/public/PublicHeader.tsx` - Affichage utilisateur + déconnexion
- `src/app/dashboard/layout.tsx` - Protection des routes
- `src/app/layout.tsx` - Ajout de AuthProvider
- `src/store/index.ts` - Export du auth-store
- `src/hooks/index.ts` - Export des hooks auth
- `database/schema.sql` - Contrainte FK sur profiles

---

## Test de l'authentification

1. **Inscription** :
   - Aller sur `/register`
   - Créer un compte avec un email valide
   - Vérifier que le profil est créé dans Supabase

2. **Connexion** :
   - Aller sur `/login`
   - Se connecter avec les identifiants créés
   - Vérifier la redirection selon le rôle

3. **Protection dashboard** :
   - Se déconnecter
   - Essayer d'accéder à `/dashboard`
   - Vérifier la redirection vers `/login`

4. **Déconnexion** :
   - Se connecter
   - Cliquer sur "Déconnexion"
   - Vérifier la redirection vers `/home`

---

**L'authentification est maintenant complètement fonctionnelle ! 🎉**

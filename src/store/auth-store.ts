import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/** Ligne table admins (schéma DB) */
interface AdminRow {
  id: string
  name: string
  email: string
  auth_user_id?: string | null
  avatar_url?: string | null
  is_super_admin?: boolean | null
  permissions?: string[] | null
  created_at: string
  last_login_at?: string | null
}

/** Ligne table profiles (schéma DB) */
interface ProfileRow {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string | null
  created_at: string
}

/** Type pour les appels Supabase admins/profiles (types générés absents) */
type AuthTableChain = {
  select: (cols?: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: AdminRow | ProfileRow | null; error: unknown }> } }
  update: (v: { last_login_at: string }) => { eq: (col: string, val: string) => { then: (onFulfilled?: () => void, onRejected?: (e: unknown) => void) => Promise<unknown> } }
  insert: (v: { id: string; name: string; email: string; role: string }) => { select: () => { maybeSingle: () => Promise<{ data: ProfileRow | null; error: unknown }> } }
}

const authDb = supabase as unknown as {
  from: (
    table:
      | 'admins'
      | 'profiles'
      | 'admin_roles'
      | 'roles'
      | 'role_permissions'
      | 'permissions'
  ) => AuthTableChain & {
    select: (cols?: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>
      }
      in?: (col: string, val: string[]) => Promise<{ data: unknown; error: unknown }>
      then?: unknown
    }
  }
}

type DashboardRole = string

interface RoleRow {
  id: string
  code: string
}

interface AdminRoleRow {
  role_id: string
}

interface RolePermissionRow {
  permission_id: string
}

interface PermissionRow {
  id: string
  code: string
}

interface CurrentAuthorizationSnapshot {
  roles?: string[]
  permissions?: string[]
  dashboard_role?: string
  is_super_admin?: boolean
}

async function loadAuthorizationForAdmin(admin: AdminRow): Promise<{
  roles: string[]
  permissions: string[]
  dashboardRole: DashboardRole
}> {
  try {
    const { data: snapshot, error: snapshotError } = await (supabase.rpc('current_admin_authorization') as any)
    if (!snapshotError && snapshot) {
      const authz = snapshot as CurrentAuthorizationSnapshot
      return {
        roles: Array.isArray(authz.roles) ? authz.roles : [],
        permissions: Array.isArray(authz.permissions) ? authz.permissions : [],
        dashboardRole: (authz.dashboard_role ?? 'utilisateur') as DashboardRole,
      }
    }
  } catch {
    // Fallback on legacy loader below.
  }

  if (admin.is_super_admin) {
    const { data: allPerms } = await (supabase.from('permissions') as any).select('code')
    const permissionCodes = ((allPerms ?? []) as PermissionRow[]).map((p) => p.code)
    return {
      roles: ['super_admin'],
      permissions: permissionCodes,
      dashboardRole: 'super_admin',
    }
  }

  const { data: adminRoles } = await (supabase.from('admin_roles') as any)
    .select('role_id')
    .eq('admin_id', admin.id)
  const roleIds = ((adminRoles ?? []) as AdminRoleRow[]).map((row) => row.role_id)
  if (roleIds.length === 0) {
    return {
      roles: [],
      permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      dashboardRole: 'utilisateur',
    }
  }

  const { data: rolesRows } = await (supabase.from('roles') as any)
    .select('id,code')
    .in('id', roleIds)
  const roleCodes = ((rolesRows ?? []) as RoleRow[]).map((row) => row.code)

  const { data: rolePermissionRows } = await (supabase.from('role_permissions') as any)
    .select('permission_id')
    .in('role_id', roleIds)
  const permissionIds = Array.from(
    new Set(((rolePermissionRows ?? []) as RolePermissionRow[]).map((row) => row.permission_id))
  )

  let permissionCodes: string[] = []
  if (permissionIds.length > 0) {
    const { data: permissionsRows } = await (supabase.from('permissions') as any)
      .select('id,code')
      .in('id', permissionIds)
    permissionCodes = ((permissionsRows ?? []) as PermissionRow[]).map((row) => row.code)
  }

  const fallbackFromLegacy = Array.isArray(admin.permissions) ? admin.permissions : []
  const mergedPermissions = Array.from(new Set([...permissionCodes, ...fallbackFromLegacy]))

  const dashboardRole: DashboardRole = roleCodes[0] ?? 'utilisateur'

  return {
    roles: roleCodes,
    permissions: mergedPermissions,
    dashboardRole,
  }
}

interface AuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  initialized: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  refreshSession: () => Promise<void>
  setUser: (user: User | null) => void
}

/**
 * Vérifie si une erreur est vide ou non significative
 */
function isEmptyOrAbortError(error: unknown): boolean {
  if (!error) return true
  const err = error as { name?: string; code?: string; message?: string }
  if (
    err?.name === 'AbortError' ||
    err?.code === 'ABORTED' ||
    err?.message?.includes('aborted') ||
    err?.message?.includes('AbortError')
  ) {
    return true
  }
  if (typeof error === 'object') {
    const hasCode = err?.code && err.code !== 'PGRST116'
    const hasMessage = err?.message && err.message.length > 0
    if (!hasCode && !hasMessage) {
      return true
    }
  }
  
  return false
}

// Helper pour mapper Supabase User vers notre User
async function mapSupabaseUserToUser(supabaseUser: SupabaseUser | null): Promise<User | null> {
  if (!supabaseUser) return null
  
  if (!supabaseUser.email) {
    console.warn('[AuthStore] Supabase user has no email')
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || 'User',
      email: '',
      role: 'customer' as User['role'],
        dashboardRole: undefined,
        isSuperAdmin: false,
        permissions: [],
        roles: [],
      avatar: undefined,
      createdAt: supabaseUser.created_at || new Date().toISOString(),
    }
  }

  // PRIORITÉ 1 : Vérifier si l'utilisateur est un admin
  try {
    const { data: admin, error: adminError } = await authDb
      .from('admins')
      .select('*')
      .eq('email', supabaseUser.email)
      .maybeSingle()

    const adminRow = admin as AdminRow | null
    if (adminRow && !adminError) {
      const authz = await loadAuthorizationForAdmin(adminRow)
      authDb
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminRow.id)
        .then(() => {}, () => {})

      return {
        id: adminRow.id,
        name: adminRow.name,
        email: adminRow.email,
        role: 'admin' as User['role'],
        dashboardRole: authz.dashboardRole,
        isSuperAdmin: adminRow.is_super_admin ?? false,
        permissions: authz.permissions,
        roles: authz.roles,
        avatar: adminRow.avatar_url ?? undefined,
        createdAt: adminRow.created_at,
      }
    }
    const err = adminError as { code?: string; message?: string } | null
    if (err && !isEmptyOrAbortError(adminError) && err.code !== 'PGRST116') {
      console.warn('[Auth] Admin check error:', err.message ?? err.code)
    }
  } catch (error: unknown) {
    if (!isEmptyOrAbortError(error)) {
      console.warn('[Auth] Admin check failed:', error instanceof Error ? error.message : String(error))
    }
  }

  // PRIORITÉ 2 : Récupérer le profil
  try {
    const { data: profile, error: profileError } = await authDb
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle()

    const profileRow = profile as ProfileRow | null
    if (profileRow && !profileError) {
      return {
        id: profileRow.id,
        name: profileRow.name,
        email: profileRow.email,
        role: profileRow.role as User['role'],
        dashboardRole: undefined,
        isSuperAdmin: false,
        permissions: [],
        roles: [],
        avatar: profileRow.avatar_url ?? undefined,
        createdAt: profileRow.created_at,
      }
    }

    if (!profileRow) {
      const { data: newProfile, error: createError } = await authDb
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          email: supabaseUser.email || '',
          role: 'customer',
        })
        .select()
        .maybeSingle()

      const newProfileRow = newProfile as ProfileRow | null
      if (newProfileRow && !createError) {
        return {
          id: newProfileRow.id,
          name: newProfileRow.name,
          email: newProfileRow.email,
          role: newProfileRow.role as User['role'],
          dashboardRole: undefined,
          isSuperAdmin: false,
          permissions: [],
          roles: [],
          avatar: newProfileRow.avatar_url ?? undefined,
          createdAt: newProfileRow.created_at,
        }
      }

      const createErr = createError as { code?: string; message?: string } | null
      if (createErr?.code === '23505') {
        await new Promise(resolve => setTimeout(resolve, 200))
        const { data: retryProfile } = await authDb
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle()

        const retryProfileRow = retryProfile as ProfileRow | null
        if (retryProfileRow) {
          return {
            id: retryProfileRow.id,
            name: retryProfileRow.name,
            email: retryProfileRow.email,
            role: retryProfileRow.role as User['role'],
            dashboardRole: undefined,
            isSuperAdmin: false,
            permissions: [],
            roles: [],
            avatar: retryProfileRow.avatar_url ?? undefined,
            createdAt: retryProfileRow.created_at,
          }
        }
      }

      if (createErr && !isEmptyOrAbortError(createError) && createErr.code !== '23505') {
        console.warn('[Auth] Profile creation error:', createErr.message ?? createErr.code)
      }
    }
  } catch (error: unknown) {
    if (!isEmptyOrAbortError(error)) {
      console.warn('[Auth] Profile check failed:', error instanceof Error ? error.message : String(error))
    }
  }

  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    role: 'customer' as User['role'],
    dashboardRole: undefined,
    isSuperAdmin: false,
    permissions: [],
    roles: [],
    avatar: undefined,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      supabaseUser: null,
      loading: false,
      initialized: false,

      setUser: (user) => set({ user }),

      signIn: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ loading: false })
            return { error }
          }

          if (data.user) {
            const user = await mapSupabaseUserToUser(data.user)

            if (!user) {
              set({ loading: false })
              return { error: new Error('Failed to map user data') }
            }
            
            set({
              user,
              supabaseUser: data.user,
              loading: false,
              initialized: true,
            })
            
            return { error: null }
          }

          set({ loading: false })
          return { error: new Error('No user data returned') }
        } catch (error) {
          set({ loading: false })
          return { error: error instanceof Error ? error : new Error('Unknown error') }
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          })

          if (error) {
            set({ loading: false })
            return { error }
          }

          if (data.user) {
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const { error: profileError } = await authDb
              .from('profiles')
              .insert({
                id: data.user.id,
                name: fullName,
                email: email,
                role: 'customer',
              })
              .select()
              .maybeSingle()

            const err = profileError as { code?: string; message?: string } | null
            if (err && err.code !== '23505' && !isEmptyOrAbortError(profileError)) {
              console.warn('[Auth] Profile creation during signup:', err.message)
            }

            const user = await mapSupabaseUserToUser(data.user)
            set({
              user,
              supabaseUser: data.user,
              loading: false,
            })
            return { error: null }
          }

          set({ loading: false })
          return { error: new Error('No user data returned') }
        } catch (error) {
          set({ loading: false })
          return { error: error instanceof Error ? error : new Error('Unknown error') }
        }
      },

      signOut: async () => {
        const clearSession = () => {
          set({
            user: null,
            supabaseUser: null,
            loading: false,
            initialized: true,
          })
        }
        try {
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.warn('[AuthStore] Sign out error (clearing session anyway):', error.message)
          }
          clearSession()
        } catch (error) {
          // AuthSessionMissingError ou autre : pas de session côté Supabase, on vide quand même le store
          const msg = error instanceof Error ? error.message : String(error)
          if (!msg?.includes('session') && !msg?.includes('Session')) {
            console.warn('[AuthStore] Sign out exception:', msg)
          }
          clearSession()
        }
      },

      initialize: async () => {
        if (get().initialized && get().user) {
          return
        }

        set({ loading: true })

        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('[Auth] Error getting session:', error)
            set({ loading: false, initialized: true })
            return
          }

          if (session?.user) {
            try {
              const user = await mapSupabaseUserToUser(session.user)
              set({
                user,
                supabaseUser: session.user,
                loading: false,
                initialized: true,
              })
            } catch (error) {
              console.error('[Auth] Error mapping user:', error)
              set({
                user: null,
                supabaseUser: session.user,
                loading: false,
                initialized: true,
              })
            }
          } else {
            set({
              user: null,
              supabaseUser: null,
              loading: false,
              initialized: true,
            })
          }

          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                const user = await mapSupabaseUserToUser(session.user)
                set({
                  user,
                  supabaseUser: session.user,
                  loading: false,
                  initialized: true,
                })
              } catch (error) {
                console.error('[AuthStore] Error mapping user:', error)
                set({
                  user: null,
                  supabaseUser: session.user,
                  loading: false,
                  initialized: true,
                })
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                supabaseUser: null,
                loading: false,
                initialized: true,
              })
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              const user = await mapSupabaseUserToUser(session.user)
              set({
                user,
                supabaseUser: session.user,
              })
            }
          })
        } catch (error) {
          console.error('[Auth] Error initializing:', error)
          set({ loading: false, initialized: true })
        }
      },

      refreshSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            console.error('[Auth] Error refreshing session:', error)
            return
          }

          if (session?.user) {
            const user = await mapSupabaseUserToUser(session.user)
            set({
              user,
              supabaseUser: session.user,
              initialized: true,
            })
          } else {
            set({
              user: null,
              supabaseUser: null,
              initialized: true,
            })
          }
        } catch (error) {
          console.error('[Auth] Error refreshing session:', error)
        }
      },
    }),
    {
      name: 'mindef-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Ne persister que user et initialized pour un chargement rapide
      partialize: (state) => ({
        user: state.user,
        initialized: state.initialized,
      }),
    }
  )
)

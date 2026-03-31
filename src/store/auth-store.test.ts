import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './auth-store'

// Mock Supabase client pour éviter les appels réseau
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      then: vi.fn((cb?: (value: unknown) => unknown) => Promise.resolve(cb ? cb(undefined) : undefined)),
    })),
  },
}))

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      supabaseUser: null,
      loading: false,
      initialized: false,
    })
  })

  describe('état initial', () => {
    it('a user null', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })
    it('a supabaseUser null', () => {
      expect(useAuthStore.getState().supabaseUser).toBeNull()
    })
    it('loading est false', () => {
      expect(useAuthStore.getState().loading).toBe(false)
    })
    it('initialized est false', () => {
      expect(useAuthStore.getState().initialized).toBe(false)
    })
  })

  describe('setUser', () => {
    it('met à jour user', () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer' as const,
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }
      useAuthStore.getState().setUser(user)
      expect(useAuthStore.getState().user).toEqual(user)
    })
    it('accepte null pour déconnexion', () => {
      useAuthStore.getState().setUser({
        id: 'u',
        name: 'U',
        email: 'u@u.com',
        role: 'customer',
        createdAt: new Date().toISOString(),
      })
      useAuthStore.getState().setUser(null)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('signOut', () => {
    it('réinitialise user et supabaseUser après signOut', async () => {
      useAuthStore.setState({
        user: { id: 'u', name: 'U', email: 'u@u.com', role: 'customer', createdAt: new Date().toISOString() },
        supabaseUser: {} as never,
        initialized: true,
      })
      await useAuthStore.getState().signOut()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().supabaseUser).toBeNull()
      expect(useAuthStore.getState().initialized).toBe(true)
    })
  })
})

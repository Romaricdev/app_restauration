import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, zodErrorsToFieldErrors } from './auth.schema'

describe('auth.schema', () => {
  describe('loginSchema', () => {
    it('valide un email et mot de passe corrects', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })
    it('refuse un email vide', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true)
      }
    })
    it('refuse un email invalide', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })
    it('refuse un mot de passe trop court', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '12345',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('valide des données complètes correctes', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jean Dupont',
        email: 'jean@example.com',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
      })
      expect(result.success).toBe(true)
    })
    it('refuse si les mots de passe ne correspondent pas', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jean Dupont',
        email: 'jean@example.com',
        password: 'SecurePass1',
        confirmPassword: 'OtherPass1',
      })
      expect(result.success).toBe(false)
    })
    it('refuse un nom trop court', () => {
      const result = registerSchema.safeParse({
        fullName: 'J',
        email: 'jean@example.com',
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('zodErrorsToFieldErrors', () => {
    it('mappe les erreurs vers un objet field -> message', () => {
      const result = loginSchema.safeParse({ email: '', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = zodErrorsToFieldErrors(result)
        expect(Object.keys(errors).length).toBeGreaterThan(0)
        expect(typeof errors.email === 'string' || typeof errors.password === 'string').toBe(true)
      }
    })
  })
})

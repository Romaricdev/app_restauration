import { describe, it, expect } from 'vitest'
import {
  cn,
  formatPrice,
  formatDate,
  formatTime,
  generateId,
  truncate,
  slugify,
  todayIso,
  isReservationActiveNow,
} from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('fusionne les classes', () => {
      expect(cn('a', 'b')).toBe('a b')
    })
    it('gère les conditionnels', () => {
      expect(cn('a', false && 'b', 'c')).toContain('a')
      expect(cn('a', false && 'b', 'c')).toContain('c')
    })
  })

  describe('formatPrice', () => {
    it('formate en FCFA par défaut (XAF)', () => {
      const s = formatPrice(1500)
      expect(s).toMatch(/\d[\s\u202f]?500/)
    })
    it('formate un grand nombre', () => {
      const s = formatPrice(10000)
      expect(s).toMatch(/10[\s\u202f]?000/)
    })
  })

  describe('formatDate', () => {
    it('formate une date en français', () => {
      const s = formatDate('2025-01-15')
      expect(s).toMatch(/15/)
      expect(s).toMatch(/janvier|Janvier/)
      expect(s).toMatch(/2025/)
    })
  })

  describe('formatTime', () => {
    it('formate une heure', () => {
      const s = formatTime(new Date('2025-01-01T14:30:00'))
      expect(s).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('generateId', () => {
    it('retourne une chaîne non vide', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
    it('retourne des valeurs différentes à chaque appel', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 50; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(50)
    })
    it('utilise crypto.randomUUID quand disponible (format UUID)', () => {
      const id = generateId()
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      }
    })
  })

  describe('truncate', () => {
    it('tronque au-delà de la longueur', () => {
      expect(truncate('hello world', 5)).toBe('hello...')
    })
    it('ne tronque pas si plus court', () => {
      expect(truncate('hi', 10)).toBe('hi')
    })
  })

  describe('slugify', () => {
    it('met en minuscules et remplace les espaces', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })
    it('supprime les accents', () => {
      expect(slugify('Café')).toBe('cafe')
    })
    it('retourne item pour chaîne vide après nettoyage', () => {
      expect(slugify('   ')).toBe('item')
    })
  })

  describe('todayIso', () => {
    it('retourne YYYY-MM-DD', () => {
      const s = todayIso()
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('isReservationActiveNow', () => {
    it('retourne false si la date n’est pas aujourd’hui', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().slice(0, 10)
      expect(isReservationActiveNow({ date: dateStr, time: '12:00' })).toBe(false)
    })
  })
})

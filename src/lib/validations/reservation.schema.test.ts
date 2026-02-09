import { describe, it, expect } from 'vitest'
import {
  tableReservationSchema,
  validateTableReservation,
} from './reservation.schema'

describe('reservation.schema', () => {
  const validTableData = {
    fullName: 'Jean Dupont',
    phone: '690000000',
    date: '2026-12-01',
    time: '12:30',
    partySize: '2',
    message: '',
  }

  describe('tableReservationSchema', () => {
    it('valide des données correctes', () => {
      const result = tableReservationSchema.safeParse(validTableData)
      expect(result.success).toBe(true)
    })
    it('refuse un nom vide', () => {
      const result = tableReservationSchema.safeParse({
        ...validTableData,
        fullName: '',
      })
      expect(result.success).toBe(false)
    })
    it('refuse un téléphone invalide', () => {
      const result = tableReservationSchema.safeParse({
        ...validTableData,
        phone: '123',
      })
      expect(result.success).toBe(false)
    })
    it('refuse une date dans le passé', () => {
      const result = tableReservationSchema.safeParse({
        ...validTableData,
        date: '2020-01-01',
      })
      expect(result.success).toBe(false)
    })
    it('refuse partySize vide', () => {
      const result = tableReservationSchema.safeParse({
        ...validTableData,
        partySize: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validateTableReservation', () => {
    it('retourne null si les données sont valides', () => {
      expect(validateTableReservation(validTableData)).toBeNull()
    })
    it('retourne un objet d’erreurs par champ si invalide', () => {
      const errors = validateTableReservation({
        ...validTableData,
        fullName: '',
      })
      expect(errors).not.toBeNull()
      expect(errors?.fullName).toBeDefined()
    })
  })
})

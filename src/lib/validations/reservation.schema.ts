import { z } from 'zod'

/** Regex téléphone Cameroun : +237 ou 237 optionnel, puis 6/7/8/9 et 8 chiffres */
const phoneCam = /^(\+237|237)?[6-9]\d{8}$/

/** Schéma de validation pour la réservation de table (aligné ReservationFormData) */
export const tableReservationSchema = z
  .object({
    fullName: z.string().min(1, 'Le nom est requis').trim(),
    phone: z
      .string()
      .min(1, 'Le numéro de téléphone est requis')
      .transform((s) => s.replace(/\s/g, ''))
      .refine((s) => phoneCam.test(s), 'Format de téléphone invalide'),
    date: z.string().min(1, 'La date est requise'),
    time: z.string().min(1, "L'heure est requise"),
    partySize: z.string().min(1, 'Le nombre de personnes est requis'),
    message: z.string().optional(),
  })
  .refine(
    (data) => {
      const d = new Date(data.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d >= today
    },
    { message: 'La date ne peut pas être dans le passé', path: ['date'] }
  )

/** Schéma de validation pour la réservation de salle (champs communs) */
export const hallReservationBaseSchema = z.object({
  customerName: z.string().min(1, 'Le nom est requis').trim(),
  customerPhone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .transform((s) => s.replace(/\s/g, ''))
    .refine((s) => phoneCam.test(s), 'Format de téléphone invalide'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  eventType: z.string().optional(),
  expectedGuests: z.number().int().min(1).optional(),
  notes: z.string().optional(),
})

export type TableReservationInput = z.infer<typeof tableReservationSchema>
export type HallReservationBaseInput = z.infer<typeof hallReservationBaseSchema>

/** Valide les données table et retourne les erreurs par champ ou null si valide */
export function validateTableReservation(
  data: Record<string, unknown>
): Partial<Record<keyof TableReservationInput, string>> | null {
  const result = tableReservationSchema.safeParse(data)
  if (result.success) return null
  const errors: Partial<Record<keyof TableReservationInput, string>> = {}
  for (const issue of result.error.issues) {
    const path = issue.path[0]
    if (typeof path === 'string' && !(path in errors)) {
      errors[path as keyof TableReservationInput] = issue.message
    }
  }
  return errors
}

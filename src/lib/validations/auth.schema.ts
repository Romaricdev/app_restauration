import { z } from 'zod'

/** Schéma de validation pour le formulaire de connexion */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

/** Schéma de validation pour le formulaire d'inscription */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Le nom complet est requis')
      .min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide"),
    password: z
      .string()
      .min(1, 'Le mot de passe est requis')
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string().min(1, 'La confirmation est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

/** Mappe les erreurs Zod vers un objet field -> message (premier message par champ) */
export function zodErrorsToFieldErrors<T extends string>(
  result: z.ZodSafeParseError<unknown>
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of result.error.issues) {
    const path = issue.path[0]
    if (typeof path === 'string' && !(path in errors)) {
      errors[path as T] = issue.message
    }
  }
  return errors
}

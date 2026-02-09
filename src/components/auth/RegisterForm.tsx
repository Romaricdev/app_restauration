'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { registerSchema, zodErrorsToFieldErrors } from '@/lib/validations/auth.schema'
import { useAuth } from '@/hooks/useAuth'

interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface RegisterFormProps {
  onSwitchToLogin?: () => void
}

// Password strength indicator
function getPasswordStrength(password: string): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } {
  if (password.length === 0) {
    return { strength: 'weak', label: '', color: 'bg-gray-200' }
  }
  if (password.length < 6) {
    return { strength: 'weak', label: 'Faible', color: 'bg-red-500' }
  }
  if (password.length < 10 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { strength: 'medium', label: 'Moyen', color: 'bg-yellow-500' }
  }
  return { strength: 'strong', label: 'Fort', color: 'bg-green-500' }
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter()
  const { signUp, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const result = registerSchema.safeParse(formData)
    if (result.success) {
      setErrors({})
      return true
    }
    const newErrors = zodErrorsToFieldErrors<keyof RegisterFormData>(result)
    setErrors(newErrors)
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)
    setShowError(false)
    setErrorMessage('')

    // Appel à Supabase Auth
    const { error } = await signUp(formData.email, formData.password, formData.fullName)

    setIsLoading(false)

    if (error) {
      setShowError(true)
      // Messages d'erreur plus explicites
      if (error.message.includes('User already registered')) {
        setErrorMessage('Cet email est déjà utilisé. Veuillez vous connecter.')
      } else if (error.message.includes('Password')) {
        setErrorMessage('Le mot de passe ne respecte pas les critères requis.')
      } else {
        setErrorMessage(error.message || 'Une erreur est survenue lors de la création du compte.')
      }
    } else {
      setShowSuccess(true)
      // Rediriger vers la page d'accueil après inscription
      setTimeout(() => {
        router.push('/home')
      }, 2000)
    }
  }

  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Compte créé avec succès !
        </h2>
        <p className="text-gray-600 mb-4">
          Redirection en cours...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Votre nom complet"
            className={cn(
              'pl-12 h-12 sm:h-14 text-base',
              errors.fullName && 'border-red-500 focus:ring-red-500'
            )}
            required
            autoComplete="name"
          />
        </div>
        {errors.fullName && (
          <p className="mt-2 text-sm text-red-500">{errors.fullName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="votre@email.com"
            className={cn(
              'pl-12 h-12 sm:h-14 text-base',
              errors.email && 'border-red-500 focus:ring-red-500'
            )}
            required
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="••••••••"
            className={cn(
              'pl-12 pr-12 h-12 sm:h-14 text-base',
              errors.password && 'border-red-500 focus:ring-red-500'
            )}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-2 text-sm text-red-500">{errors.password}</p>
        )}
        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    passwordStrength.color
                  )}
                  style={{
                    width:
                      passwordStrength.strength === 'weak'
                        ? '33%'
                        : passwordStrength.strength === 'medium'
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>
              {passwordStrength.label && (
                <span className={cn(
                  'text-xs font-medium',
                  passwordStrength.strength === 'weak' && 'text-red-600',
                  passwordStrength.strength === 'medium' && 'text-yellow-600',
                  passwordStrength.strength === 'strong' && 'text-green-600'
                )}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Utilisez au moins 6 caractères, avec majuscules, minuscules et chiffres pour plus de sécurité
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="••••••••"
            className={cn(
              'pl-12 pr-12 h-12 sm:h-14 text-base',
              errors.confirmPassword && 'border-red-500 focus:ring-red-500',
              formData.confirmPassword &&
                formData.password === formData.confirmPassword &&
                !errors.confirmPassword &&
                'border-green-500 focus:ring-green-500'
            )}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
        )}
        {formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          !errors.confirmPassword && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Les mots de passe correspondent
            </p>
          )}
      </div>

      {/* Error Message */}
      {showError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Erreur d&apos;inscription
            </p>
            <p className="text-sm text-red-700 mt-1">
              {errorMessage || 'Une erreur est survenue lors de la création du compte.'}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="site-primary"
        size="lg"
        className="w-full gap-2 min-h-[48px]"
        disabled={isLoading || authLoading}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Création...
          </>
        ) : (
          <>
            <User className="w-5 h-5" />
            Créer un compte
          </>
        )}
      </Button>
    </form>
  )
}

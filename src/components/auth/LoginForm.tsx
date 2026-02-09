'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loginSchema, zodErrorsToFieldErrors } from '@/lib/validations/auth.schema'
import { ReCaptcha } from './ReCaptcha'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter()
  const { signIn, loading: authLoading, user: authUser } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)
  const [recaptchaError, setRecaptchaError] = useState(false)

  // Écouter les changements de l'utilisateur pour rediriger automatiquement
  useEffect(() => {
    if (showSuccess) {
      // Attendre un peu pour être sûr que le store est complètement mis à jour
      // et que la session est bien établie
      const redirectTimer = setTimeout(() => {
        // Toujours vérifier depuis le store pour avoir la valeur la plus à jour
        const { user: storeUser } = useAuthStore.getState()
        const finalUser = storeUser || authUser

        if (!finalUser) {
          console.warn('[LoginForm] No user found, cannot redirect')
          return
        }

        if (finalUser.role === 'admin') {
          router.push('/dashboard')
        } else {
          router.push('/home')
        }
      }, 1000) // Délai plus long pour s'assurer que tout est synchronisé

      return () => clearTimeout(redirectTimer)
    }
  }, [showSuccess, authUser, router])

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setShowError(false)
  }

  const validate = (): boolean => {
    const result = loginSchema.safeParse(formData)
    if (result.success) {
      setErrors({})
      if (!recaptchaVerified) {
        setRecaptchaError(true)
        return false
      }
      setRecaptchaError(false)
      return true
    }
    const newErrors = zodErrorsToFieldErrors<keyof LoginFormData>(result)
    setErrors(newErrors)
    if (!recaptchaVerified) {
      setRecaptchaError(true)
    } else {
      setRecaptchaError(false)
    }
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
    const { error } = await signIn(formData.email, formData.password)

    setIsLoading(false)

    if (error) {
      setShowError(true)
      // Messages d'erreur plus explicites
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('Email ou mot de passe incorrect.')
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMessage('Veuillez confirmer votre email avant de vous connecter.')
      } else {
        setErrorMessage(error.message || 'Une erreur est survenue lors de la connexion.')
      }
    } else {
      setShowSuccess(true)
      // La redirection sera gérée par le useEffect qui écoute les changements de authUser
      // Cela permet d'attendre que mapSupabaseUserToUser soit complètement terminé
    }
  }

  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Connexion réussie !
        </h2>
        <p className="text-gray-600 mb-4">
          Redirection en cours...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
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
            autoComplete="current-password"
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
      </div>

      {/* reCAPTCHA */}
      <div>
        <ReCaptcha
          onVerify={(verified) => {
            setRecaptchaVerified(verified)
            setRecaptchaError(false)
          }}
          error={recaptchaError}
        />
      </div>

      {/* Error Message */}
      {showError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Erreur de connexion
            </p>
            <p className="text-sm text-red-700 mt-1">
              {errorMessage || 'Email ou mot de passe incorrect. Veuillez réessayer.'}
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
            Connexion...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Se connecter
          </>
        )}
      </Button>

      {/* Forgot Password Link */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-[#F4A024] hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  )
}

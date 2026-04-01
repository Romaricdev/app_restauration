'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard, LoginForm } from '@/components/auth'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPostLoginPath } from '@/lib/permissions'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, initialized } = useAuth()

  useEffect(() => {
    if (!initialized || loading || !user) return
    router.replace(getPostLoginPath(user))
  }, [user, loading, initialized, router])

  if (!initialized || loading || user) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[#F4A024] border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Chargement…</span>
      </div>
    )
  }

  return (
    <AuthCard
      title="Connexion"
      subtitle="Connectez-vous à votre compte pour continuer"
      footer={
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vous n&apos;avez pas de compte ?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#F4A024] hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}

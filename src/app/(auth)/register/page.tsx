'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard, RegisterForm } from '@/components/auth'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPostLoginPath } from '@/lib/permissions'

export default function RegisterPage() {
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
      title="Créer un compte"
      subtitle="Rejoignez-nous pour profiter de nos services"
      footer={
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#F4A024] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}

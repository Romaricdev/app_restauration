import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { BackOnlineToast } from '@/components/BackOnlineToast'
import { CartHydrate } from '@/components/CartHydrate'

export const metadata: Metadata = {
  title: 'Mess des Officiers',
  description: 'Système de gestion de restaurant - Mess des Officiers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <CartHydrate />
            {children}
            <BackOnlineToast />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

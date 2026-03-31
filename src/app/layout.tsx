import type { Metadata } from 'next'
import { Open_Sans } from 'next/font/google'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { BackOnlineToast } from '@/components/BackOnlineToast'
import { CartHydrate } from '@/components/CartHydrate'

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

export const metadata: Metadata = {
  title: 'Restaurant Central',
  description: 'Système de gestion de restaurant - Restaurant Central',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={openSans.variable}>
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

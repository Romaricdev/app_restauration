'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Fallback UI (optionnel). Si absent, utilise le fallback par défaut. */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary React : intercepte les erreurs de rendu et les erreurs runtime
 * dans l'arbre des composants enfants. Affiche un fallback minimal (message + retry)
 * au lieu de faire crasher toute l'application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // En dev, on peut logger vers un service (Sentry, etc.) plus tard
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught error:', error, errorInfo.componentStack)
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          role="alert"
          className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-12 text-center"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {this.state.error.message || 'Erreur inattendue. Veuillez réessayer.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 bg-[#F4A024] text-white font-medium rounded-lg hover:bg-[#d88d1f] transition-colors"
          >
            Réessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

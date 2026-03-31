'use client'

import { Clock, User, LogOut, ChefHat, AlertTriangle, Receipt, WifiOff, Cloud } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { usePosStore } from '@/store/pos-store'
import { subscribePosSync } from '@/lib/pos-sync'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function PosHeader() {
  const {
    openActiveOrdersModal,
    getActiveOrdersCount,
    getOverdueOrdersCount,
    openPaidOrdersModal,
    getPaidOrdersToday,
    getTodayRevenue,
  } = usePosStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [syncState, setSyncState] = useState({ pending: 0, online: true })

  useEffect(() => {
    return subscribePosSync((pending, online) => setSyncState({ pending, online }))
  }, [])
  const activeOrdersCount = getActiveOrdersCount()
  const overdueCount = getOverdueOrdersCount()
  const paidOrdersCount = getPaidOrdersToday().length
  const todayRevenue = getTodayRevenue()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left - Logo and title */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#F4A024] flex items-center justify-center">
          <span className="text-white font-bold text-sm">POS</span>
        </div>
        <div>
          <h1 className="text-gray-900 font-semibold text-sm">Restaurant Central</h1>
          <p className="text-gray-500 text-xs">Point de Vente</p>
        </div>
      </div>

      {/* Center - Date and Time */}
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">{formatTime(currentTime)}</span>
        <span className="text-gray-400 text-xs">•</span>
        <span className="text-xs text-gray-500 capitalize">{formatDate(currentTime)}</span>
      </div>

      {/* Right - Active Orders, User and exit */}
      <div className="flex items-center gap-3">
        {/* Active Orders Button */}
        <button
          onClick={openActiveOrdersModal}
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
            overdueCount > 0
              ? 'bg-red-100 text-red-700 hover:bg-red-200 animate-pulse'
              : activeOrdersCount > 0
              ? 'bg-[#F4A024]/10 text-[#F4A024] hover:bg-[#F4A024]/20'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <ChefHat className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Cuisine</span>
          {activeOrdersCount > 0 && (
            <span
              className={cn(
                'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full',
                overdueCount > 0
                  ? 'bg-red-600 text-white'
                  : 'bg-[#F4A024] text-white'
              )}
            >
              {activeOrdersCount}
            </span>
          )}
          {overdueCount > 0 && (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Paid Orders Button */}
        <button
          onClick={openPaidOrdersModal}
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
            paidOrdersCount > 0
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Factures</span>
          {paidOrdersCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-green-600 text-white">
              {paidOrdersCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {!syncState.online && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
              'bg-amber-100 text-amber-800'
            )}
            title="Hors ligne — les commandes seront synchronisées au retour de la connexion."
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hors ligne</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4" />
          <span className="text-sm">Caissier</span>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}

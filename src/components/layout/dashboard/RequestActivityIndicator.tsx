'use client'

import { useEffect, useState } from 'react'
import {
  DASHBOARD_NAVIGATION_END_EVENT,
  DASHBOARD_NAVIGATION_START_EVENT,
  DASHBOARD_REQUEST_END_EVENT,
  DASHBOARD_REQUEST_START_EVENT,
} from '@/lib/network/activity'

export function RequestActivityIndicator() {
  const [pendingCount, setPendingCount] = useState(0)
  const [navigationPending, setNavigationPending] = useState(false)
  const [isLongRunning, setIsLongRunning] = useState(false)

  useEffect(() => {
    const onStart = () => setPendingCount((prev) => prev + 1)
    const onEnd = () => setPendingCount((prev) => (prev > 0 ? prev - 1 : 0))
    const onNavigationStart = () => setNavigationPending(true)
    const onNavigationEnd = () => setNavigationPending(false)

    window.addEventListener(DASHBOARD_REQUEST_START_EVENT, onStart)
    window.addEventListener(DASHBOARD_REQUEST_END_EVENT, onEnd)
    window.addEventListener(DASHBOARD_NAVIGATION_START_EVENT, onNavigationStart)
    window.addEventListener(DASHBOARD_NAVIGATION_END_EVENT, onNavigationEnd)

    return () => {
      window.removeEventListener(DASHBOARD_REQUEST_START_EVENT, onStart)
      window.removeEventListener(DASHBOARD_REQUEST_END_EVENT, onEnd)
      window.removeEventListener(DASHBOARD_NAVIGATION_START_EVENT, onNavigationStart)
      window.removeEventListener(DASHBOARD_NAVIGATION_END_EVENT, onNavigationEnd)
    }
  }, [])

  const active = pendingCount > 0 || navigationPending

  useEffect(() => {
    if (!active) {
      setIsLongRunning(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsLongRunning(true)
    }, 7000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [active, pendingCount])

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-white/35 backdrop-blur-[1px] transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F4A024] border-t-transparent" />
            <span className="text-sm text-gray-700">
              {isLongRunning ? 'Chargement un peu long, merci de patienter...' : 'Chargement de la page...'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

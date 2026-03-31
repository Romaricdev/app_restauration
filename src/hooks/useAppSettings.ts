import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AppSettings {
  restaurant_name: string
  restaurant_address: string
  restaurant_phone: string
  restaurant_email: string
  opening_hours_weekdays?: string
  opening_hours_weekends?: string
  delivery_fee: number
  service_fee_rate: number
  service_fee_min: number
  time_slots: string[]
  /** Mode maintenance : bloque réservations, commandes, actions dashboard et POS. */
  maintenance_mode: boolean
}

const defaultSettings: AppSettings = {
  restaurant_name: 'Restaurant Central',
  restaurant_address: 'Quartier Général, Yaoundé',
  restaurant_phone: '+237 6XX XXX XXX',
  restaurant_email: 'contact@messofficiers.cm',
  opening_hours_weekdays: '11h30 - 22h00',
  opening_hours_weekends: '12h00 - 23h00',
  delivery_fee: 1500,
  service_fee_rate: 0.1,
  service_fee_min: 500,
  time_slots: [
    '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  ],
  maintenance_mode: false,
}

/**
 * Vérifie si une erreur est vide ou non significative
 */
function isEmptyOrAbortError(error: any): boolean {
  if (!error) return true
  
  // Erreur d'annulation
  if (
    error?.name === 'AbortError' ||
    error?.code === 'ABORTED' ||
    error?.message?.includes('aborted') ||
    error?.message?.includes('AbortError')
  ) {
    return true
  }
  
  // Erreur vide (objet sans propriétés significatives)
  if (typeof error === 'object') {
    const hasCode = error.code && error.code !== 'NO_CODE'
    const hasMessage = error.message && error.message !== 'NO_MESSAGE'
    const hasDetails = error.details
    if (!hasCode && !hasMessage && !hasDetails) {
      return true
    }
  }
  
  return false
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')

      // Vérifier si le composant est toujours monté
      if (!isMountedRef.current) return

      if (error) {
        // Ne logger que les erreurs significatives
        if (!isEmptyOrAbortError(error)) {
          console.warn('[useAppSettings] Error loading settings:', error.message || error.code)
        }
        // En cas d'erreur, garder les valeurs par défaut ou les dernières valeurs valides
        if (!hasLoadedRef.current) {
          setSettings(defaultSettings)
        }
        setLoading(false)
        return
      }

      // Convertir les données de la base en objet settings
      const loadedSettings: Partial<AppSettings> = { ...defaultSettings }
      
      if (data) {
        ;(data as Array<{ key: string; value: unknown }>).forEach((item) => {
          const key = item.key as keyof AppSettings
          const value = item.value
          
          // Gérer les différents types de valeurs JSONB
          if (key === 'time_slots') {
            if (Array.isArray(value)) {
              loadedSettings[key] = value as string[]
            } else if (typeof value === 'string') {
              try {
                loadedSettings[key] = JSON.parse(value) as string[]
              } catch {
                loadedSettings[key] = defaultSettings.time_slots
              }
            }
          } else if (key === 'delivery_fee' || key === 'service_fee_rate' || key === 'service_fee_min') {
            if (typeof value === 'number') {
              loadedSettings[key] = value
            } else if (typeof value === 'string') {
              const num = Number(value)
              if (!isNaN(num)) {
                loadedSettings[key] = num
              }
            }
          } else if (key === 'maintenance_mode') {
            loadedSettings.maintenance_mode = value === true || value === 'true' || value === 1
          } else {
            if (typeof value === 'string') {
              loadedSettings[key] = value
            } else {
              loadedSettings[key] = String(value)
            }
          }
        })
      }

      if (isMountedRef.current) {
        setSettings(loadedSettings as AppSettings)
        hasLoadedRef.current = true
      }
    } catch (error: any) {
      // Ne logger que les erreurs significatives
      if (!isEmptyOrAbortError(error)) {
        console.warn('[useAppSettings] Unexpected error:', error?.message || 'Unknown error')
      }
      if (isMountedRef.current && !hasLoadedRef.current) {
        setSettings(defaultSettings)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    loadSettings()

    return () => {
      isMountedRef.current = false
    }
  }, [loadSettings])

  return {
    settings,
    loading,
    // Helpers pour faciliter l'accès
    restaurantInfo: {
      name: settings.restaurant_name,
      address: settings.restaurant_address,
      phone: settings.restaurant_phone,
      email: settings.restaurant_email,
      openingHours: {
        weekdays: settings.opening_hours_weekdays || '11h30 - 22h00',
        weekends: settings.opening_hours_weekends || '12h00 - 23h00',
      },
    },
    deliveryFee: settings.delivery_fee,
    timeSlots: settings.time_slots,
    serviceFeeRate: settings.service_fee_rate,
    serviceFeeMin: settings.service_fee_min,
    maintenanceMode: settings.maintenance_mode,
    refetch: loadSettings,
  }
}

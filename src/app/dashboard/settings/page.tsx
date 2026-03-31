'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { useAppSettings } from '@/hooks'
import { useUIStore } from '@/store'
import { 
  Building2, 
  Clock, 
  Truck, 
  CreditCard, 
  Calendar,
  Save,
  Loader2,
  Construction
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getDashboardActionErrorMessage } from '@/lib/errors/permission'

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

export default function SettingsPage() {
  const addToast = useUIStore((s) => s.addToast)
  const { refetch: refetchAppSettings } = useAppSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Charger les paramètres depuis la base de données
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')

      if (error) {
        console.error('Error loading settings:', error)
        addToast({
          type: 'error',
          message: 'Erreur lors du chargement des paramètres',
        })
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
            // time_slots est un tableau JSON
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
            // Les nombres peuvent être stockés directement en JSONB ou comme string
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
            // Les strings peuvent être directement dans JSONB ou comme string
            if (typeof value === 'string') {
              loadedSettings[key] = value
            } else {
              // Si c'est un autre type JSONB, on le convertit en string
              loadedSettings[key] = String(value)
            }
          }
        })
      }

      setSettings(loadedSettings as AppSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
      addToast({
        type: 'error',
        message: getDashboardActionErrorMessage(error, 'Erreur lors du chargement des paramètres'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Préparer les mises à jour
      const updates = [
        { key: 'restaurant_name', value: settings.restaurant_name },
        { key: 'restaurant_address', value: settings.restaurant_address },
        { key: 'restaurant_phone', value: settings.restaurant_phone },
        { key: 'restaurant_email', value: settings.restaurant_email },
        ...(settings.opening_hours_weekdays ? [{ key: 'opening_hours_weekdays', value: settings.opening_hours_weekdays }] : []),
        ...(settings.opening_hours_weekends ? [{ key: 'opening_hours_weekends', value: settings.opening_hours_weekends }] : []),
        { key: 'delivery_fee', value: settings.delivery_fee },
        { key: 'service_fee_rate', value: settings.service_fee_rate },
        { key: 'service_fee_min', value: settings.service_fee_min },
        { key: 'time_slots', value: settings.time_slots },
        { key: 'maintenance_mode', value: settings.maintenance_mode },
      ]

      // Utiliser upsert pour créer ou mettre à jour chaque paramètre
      // Les valeurs doivent être en JSONB - Supabase gère automatiquement la conversion
      const upsertData = updates.map(({ key, value }) => ({
        key,
        value: value, // Supabase convertira automatiquement en JSONB
      }))

      const { error } = await (supabase as any)
        .from('app_settings')
        .upsert(upsertData, { onConflict: 'key' })

      if (error) {
        throw error
      }

      addToast({
        type: 'success',
        message: 'Paramètres enregistrés avec succès',
      })
      refetchAppSettings()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-settings-updated'))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      addToast({
        type: 'error',
        message: getDashboardActionErrorMessage(error, "Erreur lors de l'enregistrement"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof AppSettings, value: string | number | string[] | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-500 mt-1">Gérez les paramètres de l'application</p>
          </div>
        </div>
        <Card variant="dashboard" padding="lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#F4A024]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les paramètres de l'application et du restaurant
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* Mode maintenance */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Construction className="w-5 h-5 text-amber-600" />
            </div>
            <CardTitle>Mode maintenance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-[#F4A024] focus:ring-[#F4A024]"
            />
            <span className="text-sm font-medium text-gray-700">
              Activer le mode maintenance
            </span>
          </label>
          <p className="text-sm text-gray-500">
            Lorsque le mode maintenance est activé, les réservations en ligne (tables et salles),
            les commandes sur le site, les actions du dashboard et du POS sont bloquées.
            Seule la page Paramètres reste accessible pour désactiver le mode.
          </p>
        </CardContent>
      </Card>

      {/* Informations du Restaurant */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#F4A024]" />
            </div>
            <CardTitle>Informations du Restaurant</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du restaurant
              </label>
              <Input
                value={settings.restaurant_name}
                onChange={(e) => handleChange('restaurant_name', e.target.value)}
                placeholder="Restaurant Central"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <Input
                value={settings.restaurant_address}
                onChange={(e) => handleChange('restaurant_address', e.target.value)}
                placeholder="Quartier Général, Yaoundé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <Input
                type="tel"
                value={settings.restaurant_phone}
                onChange={(e) => handleChange('restaurant_phone', e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={settings.restaurant_email}
                onChange={(e) => handleChange('restaurant_email', e.target.value)}
                placeholder="contact@messofficiers.cm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horaires d'Ouverture */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F4A024]" />
            </div>
            <CardTitle>Horaires d'Ouverture</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semaine (Lundi - Vendredi)
              </label>
              <Input
                value={settings.opening_hours_weekdays || ''}
                onChange={(e) => handleChange('opening_hours_weekdays', e.target.value)}
                placeholder="11h30 - 22h00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week-end (Samedi - Dimanche)
              </label>
              <Input
                value={settings.opening_hours_weekends || ''}
                onChange={(e) => handleChange('opening_hours_weekends', e.target.value)}
                placeholder="12h00 - 23h00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de Livraison */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#F4A024]" />
            </div>
            <CardTitle>Paramètres de Livraison</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frais de livraison (FCFA)
            </label>
            <Input
              type="number"
              value={settings.delivery_fee}
              onChange={(e) => handleChange('delivery_fee', Number(e.target.value))}
              placeholder="1500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ce frais s'applique à toutes les commandes avec livraison (site web et POS)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de Service */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#F4A024]" />
            </div>
            <CardTitle>Paramètres de Service</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux de frais de service (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={settings.service_fee_rate}
                onChange={(e) => handleChange('service_fee_rate', Number(e.target.value))}
                placeholder="0.1"
                min="0"
                max="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemple: 0.1 = 10%
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais de service minimum (FCFA)
              </label>
              <Input
                type="number"
                value={settings.service_fee_min}
                onChange={(e) => handleChange('service_fee_min', Number(e.target.value))}
                placeholder="500"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Créneaux Horaires pour Réservations */}
      <Card variant="dashboard" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4A024]/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#F4A024]" />
            </div>
            <CardTitle>Créneaux Horaires pour Réservations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Définissez les créneaux horaires disponibles pour les réservations. 
            Séparez chaque créneau par une virgule (ex: 11:30, 12:00, 12:30).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Créneaux horaires
            </label>
            <Input
              value={settings.time_slots.join(', ')}
              onChange={(e) => {
                const slots = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
                handleChange('time_slots', slots)
              }}
              placeholder="11:30, 12:00, 12:30, 13:00, ..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: HH:MM (ex: 11:30, 12:00)
            </p>
          </div>
          {settings.time_slots.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Créneaux configurés ({settings.time_slots.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {settings.time_slots.map((slot, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

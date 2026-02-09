'use client'

import { useState, useRef } from 'react'
import { 
  ReservationForm, 
  ReservationSummary, 
  ReservationSuccess,
  ReservationTypeSelector,
  HallSlotTypeSelector,
  HallSelection,
  HallReservationForm
} from '@/components/reservation'
import type { ReservationFormData } from '@/components/reservation/ReservationForm'
import type { HallReservationFormData } from '@/components/reservation/HallReservationForm'
import { Card } from '@/components/ui'
import { Calendar, ArrowLeft } from 'lucide-react'
import { FadeIn } from '@/components/animations'
import { HallDetailsModal } from '@/components/modals'
import { createTableReservation } from '@/lib/data/reservations'
import { validateTableReservation } from '@/lib/validations/reservation.schema'
import type { Hall, ReservationSlotType } from '@/types'

// ============================================
// HERO SECTION
// ============================================

function ReservationHero({ reservationType }: { reservationType?: 'table' | 'hall' | null }) {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#F4A024]/5 via-white to-[#F4A024]/3 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4A024]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F4A024]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F4A024]/10 rounded-full mb-6 border border-[#F4A024]/20">
              <Calendar className="w-5 h-5 text-[#F4A024]" />
              <span className="text-sm font-medium text-[#F4A024]">
                {reservationType === 'hall' ? 'Réservez une salle' : reservationType === 'table' ? 'Réservez votre table' : 'Réservez'}
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              {reservationType === 'hall' 
                ? 'Réserver une salle de fête'
                : reservationType === 'table'
                ? 'Réserver une table'
                : 'Réserver'}
            </h1>
          </FadeIn>
          <FadeIn delay={0.3} direction="up">
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto text-justify">
              {reservationType === 'hall'
                ? 'Réservez une salle pour vos événements, mariages, conférences ou célébrations dans un cadre élégant et adapté à vos besoins.'
                : reservationType === 'table'
                ? 'Réservez votre table en quelques clics et profitez d\'une expérience culinaire exceptionnelle dans un cadre élégant et raffiné.'
                : 'Choisissez entre réserver une table au restaurant ou une salle pour vos événements.'}
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ============================================
// VALIDATION (Zod)
// ============================================

function validateForm(data: ReservationFormData): Partial<Record<keyof ReservationFormData, string>> {
  const errors = validateTableReservation(data as unknown as Record<string, unknown>)
  return errors ?? {}
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ReservationPage() {
  // Reservation type: null = selection, 'table' = table reservation, 'hall' = hall reservation
  const [reservationType, setReservationType] = useState<'table' | 'hall' | null>(null)
  const [selectedSlotType, setSelectedSlotType] = useState<ReservationSlotType | null>(null)
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null)
  const [hallModalOpen, setHallModalOpen] = useState(false)
  const [hallToView, setHallToView] = useState<Hall | null>(null)
  
  // Table reservation form data
  const [tableFormData, setTableFormData] = useState<ReservationFormData>({
    fullName: '',
    phone: '',
    date: '',
    time: '',
    partySize: '',
    message: '',
  })

  // Hall reservation form data
  const [hallFormData, setHallFormData] = useState<HallReservationFormData>({
    fullName: '',
    phone: '',
    email: '',
    organization: '',
    hallId: '',
    startDate: '',
    endDate: '',
    eventType: '',
    expectedGuests: '',
    message: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ReservationFormData | keyof HallReservationFormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)

  const handleTableFormChange = (data: ReservationFormData) => {
    setTableFormData(data)
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const handleHallFormChange = (data: HallReservationFormData) => {
    setHallFormData(data)
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({})
    }
  }

  const handleSelectHall = (hall: Hall) => {
    // Ouvrir le modal de détails de la salle
    setHallToView(hall)
    setHallModalOpen(true)
  }

  const handleConfirmHallSelection = (hall: Hall) => {
    // Fermer le modal et passer au formulaire
    setSelectedHall(hall)
    setHallFormData({ ...hallFormData, hallId: hall.id.toString() })
    setHallModalOpen(false)
    setHallToView(null)
  }

  const handleConfirm = async () => {
    if (reservationType === 'table') {
      const validationErrors = validateForm(tableFormData)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    } else if (reservationType === 'hall') {
      const validationErrors: Partial<Record<keyof HallReservationFormData, string>> = {}
      if (!hallFormData.fullName.trim()) {
        validationErrors.fullName = 'Le nom est requis'
      }
      if (!hallFormData.phone.trim()) {
        validationErrors.phone = 'Le téléphone est requis'
      }
      if (!hallFormData.hallId) {
        validationErrors.hallId = 'Veuillez sélectionner une salle'
      }
      if (!hallFormData.startDate) {
        validationErrors.startDate = 'La date de début est requise'
      }
      if (!hallFormData.endDate) {
        validationErrors.endDate = 'La date de fin est requise'
      }
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setIsLoading(true)
    setErrors({})
    setSubmitError(null)

    try {
      if (reservationType === 'table') {
        const partySizeRaw = tableFormData.partySize.trim()
        const partySize = partySizeRaw === '10+' ? 10 : Math.max(1, parseInt(partySizeRaw, 10) || 1)
        await createTableReservation({
          customerName: tableFormData.fullName.trim(),
          customerPhone: tableFormData.phone.trim(),
          date: tableFormData.date,
          time: tableFormData.time,
          partySize,
          notes: tableFormData.message.trim() || undefined,
        })
      } else if (reservationType === 'hall') {
        // TODO: appeler createHallReservation quand le formulaire salle sera branché au backend
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      setIsSuccess(true)
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <ReservationHero reservationType={reservationType} />
        <div ref={successRef}>
          <ReservationSuccess 
            reservationData={reservationType === 'table' ? tableFormData : {
              fullName: hallFormData.fullName,
              phone: hallFormData.phone,
              date: hallFormData.startDate,
              time: '',
              partySize: hallFormData.expectedGuests || '0',
              message: hallFormData.message,
            }} 
          />
        </div>
      </>
    )
  }

  // Type selection screen
  if (!reservationType) {
    return (
      <>
        <ReservationHero />
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ReservationTypeSelector onSelectType={setReservationType} />
          </div>
        </section>
      </>
    )
  }

  // Hall: choix du type de créneau (journée pleine / demi-journée)
  if (reservationType === 'hall' && !selectedSlotType) {
    return (
      <>
        <ReservationHero reservationType="hall" />
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => setReservationType(null)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F4A024] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Retour</span>
              </button>
            </div>
            <HallSlotTypeSelector
              onSelectSlotType={setSelectedSlotType}
              selectedSlotSlug={null}
            />
          </div>
        </section>
      </>
    )
  }

  // Hall: sélection de la salle (avec packs et contact pour le créneau choisi)
  if (reservationType === 'hall' && selectedSlotType && !selectedHall) {
    return (
      <>
        <ReservationHero reservationType="hall" />
        <section className="py-8 sm:py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => setSelectedSlotType(null)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F4A024] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Retour</span>
              </button>
            </div>
            <HallSelection
              onSelectHall={(hall) => handleSelectHall(hall)}
              selectedHallId={hallFormData.hallId ? Number(hallFormData.hallId) : undefined}
              slotTypeSlug={selectedSlotType.slug}
              showContact={true}
            />
            {hallToView && (
              <HallDetailsModal
                open={hallModalOpen}
                onOpenChange={setHallModalOpen}
                hall={hallToView}
                slotTypeSlug={selectedSlotType?.slug ?? null}
                onSelect={(hall) => handleConfirmHallSelection(hall)}
              />
            )}
          </div>
        </section>
      </>
    )
  }

  // Form screen
  return (
    <>
      <ReservationHero reservationType={reservationType} />

      {/* Form Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-10">
            <button
              onClick={() => {
                if (selectedHall) {
                  setSelectedHall(null)
                } else {
                  setReservationType(null)
                }
              }}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F4A024] transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">Retour</span>
            </button>
          </div>

          <FadeIn>
            {reservationType === 'table' ? (
              <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card variant="site" padding="lg">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                      Informations de réservation
                    </h2>
                    <ReservationForm
                      formData={tableFormData}
                      onChange={handleTableFormChange}
                      errors={errors as Partial<Record<keyof ReservationFormData, string>>}
                    />
                  </Card>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-[100px]">
                    <ReservationSummary
                      formData={tableFormData}
                      onConfirm={handleConfirm}
                      isLoading={isLoading}
                      submitError={submitError}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card variant="site" padding="lg">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
                      Informations de réservation
                    </h2>
                    <HallReservationForm
                      formData={hallFormData}
                      onChange={handleHallFormChange}
                      errors={errors as Partial<Record<keyof HallReservationFormData, string>>}
                      selectedHall={selectedHall || undefined}
                    />
                  </Card>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-[100px]">
                    <Card variant="site" padding="lg">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Récapitulatif</h2>
                      {selectedHall && (
                        <div className="space-y-5 mb-6">
                          <div>
                            <p className="text-sm sm:text-base text-gray-600 mb-2">Salle</p>
                            <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedHall.name}</p>
                          </div>
                          <div>
                            <p className="text-sm sm:text-base text-gray-600 mb-2">Capacité</p>
                            <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedHall.capacity} {selectedHall.capacity === 1 ? 'personne' : 'personnes'}</p>
                          </div>
                          {hallFormData.startDate && (
                            <div>
                              <p className="text-sm sm:text-base text-gray-600 mb-2">Date de début</p>
                              <p className="text-base sm:text-lg font-semibold text-gray-900">{new Date(hallFormData.startDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          )}
                          {hallFormData.endDate && (
                            <div>
                              <p className="text-sm sm:text-base text-gray-600 mb-2">Date de fin</p>
                              <p className="text-base sm:text-lg font-semibold text-gray-900">{new Date(hallFormData.endDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={handleConfirm}
                        disabled={isLoading || !selectedHall}
                        className="w-full mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 bg-[#F4A024] text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-[#C97F16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                      >
                        {isLoading ? 'Traitement...' : 'Confirmer la réservation'}
                      </button>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </FadeIn>
        </div>
      </section>
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { Card, Button, Badge } from '@/components/ui'
import { CheckoutForm } from '@/components/checkout'
import { formatPrice } from '@/lib/utils'
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Utensils,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  Truck
} from 'lucide-react'

// ============================================
// CART ITEM CARD
// ============================================

interface CartItemCardProps {
  item: {
    id: string
    name: string
    price: number
    quantity: number
  }
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    } else {
      onRemove(item.id)
    }
  }

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }

  return (
    <Card variant="site" padding="none" className="overflow-hidden">
      <div className="flex gap-4 sm:gap-6 p-4 sm:p-5 lg:p-6">
        {/* Image Placeholder */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center">
          <Utensils className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-base sm:text-lg lg:text-xl text-gray-900 line-clamp-2 flex-1">
              {item.name}
            </h3>
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F4A024] mb-4">
            {formatPrice(item.price, 'XAF').replace('XAF', 'FCFA')}
          </p>

          {/* Quantity Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-auto">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200">
              <button
                onClick={handleDecrease}
                className="p-2 text-gray-600 hover:text-[#F4A024] hover:bg-white rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Diminuer la quantite"
              >
                <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="w-12 sm:w-14 text-center font-semibold text-base sm:text-lg text-gray-900">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="p-2 text-gray-600 hover:text-[#F4A024] hover:bg-white rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Augmenter la quantite"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-base sm:text-lg text-gray-600">
              Total: <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity, 'XAF').replace('XAF', 'FCFA')}</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ============================================
// ORDER SUMMARY
// ============================================

export type PaymentOption = 'on_delivery' | 'mobile_money'

interface OrderSummaryProps {
  subtotal: number
  deliveryFee: number
  total: number
  paymentOption: PaymentOption
  onPaymentOptionChange: (option: PaymentOption) => void
  onCheckout: () => void
  isLoading?: boolean
  canCheckout: boolean
}

function OrderSummary({
  subtotal,
  deliveryFee,
  total,
  paymentOption,
  onPaymentOptionChange,
  onCheckout,
  isLoading = false,
  canCheckout
}: OrderSummaryProps) {
  return (
    <Card variant="site" padding="lg" className="sticky top-[100px] sm:top-[100px] lg:top-[100px]">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Récapitulatif</h2>

      <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
        <div className="flex justify-between text-base sm:text-lg text-gray-700">
          <span>Sous-total</span>
          <span className="font-semibold">{formatPrice(subtotal, 'XAF').replace('XAF', 'FCFA')}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-base sm:text-lg text-gray-700">
            <span>Frais de livraison</span>
            <span className="font-semibold">{formatPrice(deliveryFee, 'XAF').replace('XAF', 'FCFA')}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-4 sm:pt-5 flex justify-between">
          <span className="text-lg sm:text-xl font-bold text-gray-900">Total</span>
          <span className="text-xl sm:text-2xl font-bold text-[#F4A024]">{formatPrice(total, 'XAF').replace('XAF', 'FCFA')}</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Mode de paiement</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentOptionChange('on_delivery')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
              paymentOption === 'on_delivery'
                ? 'border-[#F4A024] bg-[#F4A024]/10 text-[#F4A024]'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            À la livraison / remise
          </button>
          <button
            type="button"
            onClick={() => onPaymentOptionChange('mobile_money')}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
              paymentOption === 'mobile_money'
                ? 'border-[#F4A024] bg-[#F4A024]/10 text-[#F4A024]'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Mobile Money (MTN / Orange)
          </button>
        </div>
      </div>

      {!canCheckout && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Veuillez remplir vos informations de facturation (nom et telephone) pour continuer.
          </p>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={onCheckout}
        disabled={isLoading || !canCheckout}
        className="w-full gap-2 min-h-[48px]"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Commander
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        En cliquant sur &quot;Commander&quot;, vous acceptez nos conditions generales
      </p>
    </Card>
  )
}

// ============================================
// EMPTY CART STATE
// ============================================

function EmptyCart() {
  return (
    <div className="text-center py-16 sm:py-24">
      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        Votre panier est vide
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto text-justify">
        Ajoutez des plats delicieux a votre panier pour commencer votre commande.
      </p>
      <Link href="/menu">
        <Button variant="primary" size="lg" className="gap-2">
          <ArrowLeft className="w-5 h-5" />
          Retour au Menu
        </Button>
      </Link>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

const CAMPAY_POLL_INTERVAL_MS = 2000
const CAMPAY_TIMEOUT_MS = 5 * 60 * 1000

export default function CartPage() {
  const router = useRouter()
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getServiceFee,
    getDeliveryFee,
    getTotal,
    clearCart,
    canCheckout,
    orderType,
    customerInfo,
  } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('on_delivery')
  const [campayError, setCampayError] = useState<string | null>(null)
  const [waitingMobileMoney, setWaitingMobileMoney] = useState(false)

  const subtotal = getSubtotal()
  const serviceFee = getServiceFee()
  const deliveryFee = getDeliveryFee()
  const total = getTotal()

  const buildOrderPayload = (orderId?: string) => ({
    ...(orderId ? { id: orderId } : {}),
    type: orderType,
    customerName: customerInfo?.name ?? '',
    customerPhone: customerInfo?.phone ?? '',
    customerEmail: customerInfo?.email,
    deliveryFee: deliveryFee || undefined,
    serviceFee: serviceFee || undefined,
    subtotal,
    total,
    items: items.map((it) => ({
      menuItemId: Number(it.menuItemId),
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      addons: it.addons,
    })),
  })

  const handleCheckout = async () => {
    if (!canCheckout()) return
    setCampayError(null)
    setIsCheckingOut(true)

    try {
      if (paymentOption === 'on_delivery') {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOrderPayload()),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data.error as string) ?? 'Création de la commande impossible')
        }
        clearCart()
        setIsCheckingOut(false)
        setShowSuccess(true)
        setTimeout(() => router.push('/menu'), 2000)
        return
      }

      if (paymentOption === 'mobile_money') {
        const externalReference = crypto.randomUUID()
        const collectRes = await fetch('/api/campay/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            phone: customerInfo?.phone ?? '',
            description: 'Commande Mess des Officiers',
            external_reference: externalReference,
          }),
        })
        if (!collectRes.ok) {
          const data = await collectRes.json().catch(() => ({}))
          throw new Error((data.error as string) ?? 'Demande de paiement impossible')
        }
        const { reference } = (await collectRes.json()) as { reference: string }
        setWaitingMobileMoney(true)
        setIsCheckingOut(false)

        const startTime = Date.now()
        const pollStatus = async (): Promise<void> => {
          if (Date.now() - startTime > CAMPAY_TIMEOUT_MS) {
            setWaitingMobileMoney(false)
            setCampayError('Demande expirée. Réessayez ou payez à la livraison.')
            return
          }
          const statusRes = await fetch(`/api/campay/transaction/${encodeURIComponent(reference)}`)
          if (!statusRes.ok) {
            setTimeout(pollStatus, CAMPAY_POLL_INTERVAL_MS)
            return
          }
          const statusData = (await statusRes.json()) as { status: string }
          if (statusData.status === 'SUCCESSFUL') {
            setWaitingMobileMoney(false)
            setIsCheckingOut(true)
            const orderRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(buildOrderPayload(externalReference)),
            })
            if (!orderRes.ok) {
              const data = await orderRes.json().catch(() => ({}))
              setCampayError((data.error as string) ?? 'Commande non enregistrée')
              return
            }
            const patchRes = await fetch(`/api/orders/${externalReference}/payment`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentMethod: 'mobile', paidAt: new Date().toISOString() }),
            })
            if (!patchRes.ok) {
              setCampayError('Paiement enregistré mais mise à jour facture en erreur.')
            }
            clearCart()
            setShowSuccess(true)
            setTimeout(() => router.push('/menu'), 2000)
            return
          }
          if (statusData.status === 'FAILED') {
            setWaitingMobileMoney(false)
            setCampayError('Paiement refusé ou annulé. Réessayez ou payez à la livraison.')
            return
          }
          setTimeout(pollStatus, CAMPAY_POLL_INTERVAL_MS)
        }
        pollStatus()
      }
    } catch (err) {
      setIsCheckingOut(false)
      setWaitingMobileMoney(false)
      setCampayError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Commande confirmee !
          </h2>
          <p className="text-gray-600 mb-8">
            Votre commande a ete enregistree avec succes. Vous serez redirige vers le menu.
          </p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyCart />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F4A024] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Retour au menu</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
                Mon Panier
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                {items.length} {items.length === 1 ? 'article' : 'articles'}
              </p>
            </div>
            <Badge variant="primary" className="text-sm sm:text-base w-fit">
              {items.reduce((sum, item) => sum + item.quantity, 0)} {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'article' : 'articles'}
            </Badge>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Cart Items & Checkout Form */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Cart Items */}
            <div className="space-y-4 sm:space-y-6">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Checkout Form */}
            <CheckoutForm />
          </div>

          {/* Order Summary - Sticky sur mobile en bas */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[100px]">
              {campayError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{campayError}</p>
                </div>
              )}
              {waitingMobileMoney && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-blue-900">Acceptez la demande sur votre téléphone</p>
                  <p className="text-xs text-blue-700 mt-1">MTN Money ou Orange Money</p>
                </div>
              )}
              <OrderSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                total={total}
                paymentOption={paymentOption}
                onPaymentOptionChange={setPaymentOption}
                onCheckout={handleCheckout}
                isLoading={isCheckingOut}
                canCheckout={canCheckout()}
              />
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="mt-8 sm:mt-10 lg:mt-12 p-5 sm:p-6 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm sm:text-base text-blue-800">
            <p className="font-semibold mb-1">Information importante</p>
            <p>
            Votre commande sera preparee et servie a votre table ou remise dans les meilleurs delais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

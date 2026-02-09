'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/store/cart-store'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { formatPrice, cn, generateId } from '@/lib/utils'
import { createOrderFromPos } from '@/lib/data/orders'
import { updateTableStatus } from '@/lib/data/tables'
import type { CartItem } from '@/types'
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
  ChefHat
} from 'lucide-react'

// ============================================
// CART ITEM CARD
// ============================================

interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const addonsTotal = item.addons?.reduce((sum, a) => sum + a.price * a.quantity, 0) ?? 0
  const lineUnitPrice = item.price + addonsTotal
  const lineTotal = lineUnitPrice * item.quantity

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

          {item.addons && item.addons.length > 0 && (
            <ul className="text-sm text-gray-600 mb-2 space-y-0.5">
              {item.addons.map((a) => (
                <li key={`${a.addonId}-${a.type}`}>
                  + {a.name}
                  {a.quantity > 1 ? ` × ${a.quantity}` : ''}
                  {a.price > 0 ? ` — ${formatPrice(a.price * a.quantity, 'XAF').replace('XAF', 'FCFA')}` : ' (inclus)'}
                </li>
              ))}
            </ul>
          )}

          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F4A024] mb-4">
            {formatPrice(lineUnitPrice, 'XAF').replace('XAF', 'FCFA')}
            {item.quantity > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                × {item.quantity}
              </span>
            )}
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
              Total: <span className="font-bold text-gray-900">{formatPrice(lineTotal, 'XAF').replace('XAF', 'FCFA')}</span>
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

interface OrderSummaryProps {
  subtotal: number
  serviceFee: number
  total: number
  onConfirm: () => void
  isLoading?: boolean
  tableNumber: number
}

function OrderSummary({
  subtotal,
  serviceFee,
  total,
  onConfirm,
  isLoading = false,
  tableNumber
}: OrderSummaryProps) {
  return (
    <Card variant="site" padding="lg" className="sticky top-[100px] sm:top-[100px] lg:top-[100px]">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4A024]/10 rounded-lg mb-4">
          <ChefHat className="w-4 h-4 text-[#F4A024]" />
          <span className="text-sm font-medium text-[#F4A024]">
            Table {tableNumber}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Récapitulatif</h2>
      </div>

      <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
        <div className="flex justify-between text-base sm:text-lg text-gray-700">
          <span>Sous-total</span>
          <span className="font-semibold">{formatPrice(subtotal, 'XAF').replace('XAF', 'FCFA')}</span>
        </div>
        {serviceFee > 0 && (
          <div className="flex justify-between text-base sm:text-lg text-gray-700">
            <span>Frais de service</span>
            <span className="font-semibold">{formatPrice(serviceFee, 'XAF').replace('XAF', 'FCFA')}</span>
          </div>
        )}
        <div className="border-t-2 border-gray-300 pt-4 sm:pt-5 flex justify-between">
          <span className="text-lg sm:text-xl font-bold text-gray-900">Total</span>
          <span className="text-xl sm:text-2xl font-bold text-[#F4A024]">{formatPrice(total, 'XAF').replace('XAF', 'FCFA')}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full gap-2 min-h-[48px]"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Envoi de la commande...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Commander
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Votre commande sera préparée et servie à votre table
      </p>
    </Card>
  )
}

// ============================================
// EMPTY CART STATE
// ============================================

function EmptyCart({ tableNumber }: { tableNumber: number }) {
  return (
    <div className="text-center py-16 sm:py-24">
      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
        Votre panier est vide
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto text-justify">
        Ajoutez des plats délicieux à votre panier pour commencer votre commande depuis la table {tableNumber}.
      </p>
      <Link href={`/table/${tableNumber}/menu`}>
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

interface TableCartPageProps {
  params: Promise<{ id: string }>
}

export default function TableCartPage({ params }: TableCartPageProps) {
  const { id } = use(params)
  const tableNumber = parseInt(id, 10)
  const router = useRouter()
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getServiceFee,
    getTotal,
    clearCart,
    tableNumber: cartTableNumber
  } = useCartStore()
  const [isConfirming, setIsConfirming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Ensure table number is set
  useEffect(() => {
    if (tableNumber && !isNaN(tableNumber) && cartTableNumber !== tableNumber) {
      useCartStore.getState().setTableNumber(tableNumber)
    }
  }, [tableNumber, cartTableNumber])

  const subtotal = getSubtotal()
  const serviceFee = getServiceFee()
  const total = getTotal()

  const handleConfirm = async () => {
    if (items.length === 0) return

    setIsConfirming(true)

    try {
      // Récupérer les informations de la table
      const { fetchTables } = await import('@/lib/data/tables')
      const allTables = await fetchTables()
      const table = allTables.find(t => t.number === tableNumber)
      
      if (!table) {
        throw new Error(`Table ${tableNumber} introuvable`)
      }

      // Préparer les données de la commande
      // Utiliser crypto.randomUUID() pour générer un UUID valide (requis par la base de données)
      const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateId()
      const subtotal = getSubtotal()
      const serviceFee = getServiceFee()
      const total = getTotal()

      // Mapper les items du panier vers le format attendu
      const orderItems = items.map(item => {
        const menuItemId = Number(item.menuItemId)
        if (isNaN(menuItemId)) {
          console.error('[TableCartPage] Invalid menuItemId:', item.menuItemId, 'for item:', item)
          throw new Error(`ID de produit invalide: ${item.menuItemId} pour "${item.name}"`)
        }
        
        // Utiliser crypto.randomUUID() pour les IDs d'items aussi
        const itemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateId()
        
        return {
          id: itemId,
          menuItemId: menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: undefined,
          addons: item.addons ?? [],
        }
      })

      // Créer la commande dans la base de données
      const tableId = typeof table.id === 'number' ? table.id : Number(table.id)
      if (isNaN(tableId)) {
        throw new Error(`ID de table invalide: ${table.id}`)
      }

      await createOrderFromPos({
        id: orderId,
        type: 'dine-in',
        tableId: tableId,
        tableNumber: tableNumber,
        partySize: undefined, // Peut être ajouté plus tard si nécessaire
        customerName: 'Client Table', // Nom par défaut pour les commandes QR-code
        customerPhone: '', // Peut être ajouté plus tard si nécessaire
        customerEmail: undefined,
        customerAddress: undefined,
        deliveryFee: 0,
        serviceFee: serviceFee,
        subtotal: subtotal,
        total: total, // Le total inclut déjà le service fee
        validatedAt: new Date().toISOString(),
        kitchenStatus: 'pending',
        items: orderItems,
      })

      // Mettre à jour le statut de la table
      await updateTableStatus(table.id, 'occupied', orderId)

      // Clear cart and show success
      clearCart()
      setIsConfirming(false)
      setShowSuccess(true)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/table/${tableNumber}/menu`)
      }, 3000)
    } catch (error: any) {
      console.error('[TableCartPage] Error creating order:', error)
      setIsConfirming(false)
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Erreur lors de la création de la commande. Veuillez réessayer.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        // Erreur Supabase avec code
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('new row violates row-level security')) {
          errorMessage = 'Erreur de permissions. Vérifiez les règles de sécurité de la base de données.'
        } else if (error.code === '23505') {
          errorMessage = 'Cette commande existe déjà.'
        } else if (error.code === '23503') {
          errorMessage = 'Erreur de référence (table ou produit introuvable).'
        } else {
          errorMessage = `Erreur (${error.code}): ${error.message || 'Erreur inconnue'}`
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Afficher un message d'erreur détaillé à l'utilisateur
      alert(errorMessage)
      
      // Logger les détails complets pour le débogage
      console.error('[TableCartPage] Full error details:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })
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
            Commande envoyée !
          </h2>
          <p className="text-gray-600 mb-4">
            Votre commande a été transmise à la cuisine. Nous vous servirons à la table {tableNumber} dans les plus brefs délais.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers le menu...
          </p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyCart tableNumber={tableNumber} />
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
            href={`/table/${tableNumber}/menu`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#F4A024] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">Retour au menu</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F4A024]/10 rounded-lg mb-3">
                <ChefHat className="w-4 h-4 text-[#F4A024]" />
                <span className="text-sm font-medium text-[#F4A024]">
                  Table {tableNumber}
                </span>
              </div>
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
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Order Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[100px]">
              <OrderSummary
                subtotal={subtotal}
                serviceFee={serviceFee}
                total={total}
                onConfirm={handleConfirm}
                isLoading={isConfirming}
                tableNumber={tableNumber}
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
              Votre commande sera préparée et servie directement à votre table {tableNumber}. 
              Un serveur vous apportera vos plats une fois prêts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

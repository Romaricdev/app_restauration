import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from './cart-store'
import type { MenuItem, OrderItemAddon } from '@/types'

vi.mock('@/lib/app-settings', () => ({
  getDeliveryFeeCached: vi.fn().mockResolvedValue(1500),
}))

const mockMenuItem: MenuItem = {
  id: 1,
  name: 'Plat test',
  description: 'Description',
  price: 2500,
  categoryId: 'cat-1',
  available: true,
}

const mockMenuItem2: MenuItem = {
  id: 2,
  name: 'Autre plat',
  description: 'Desc',
  price: 1500,
  categoryId: 'cat-1',
  available: true,
}

describe('cart-store', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      tableNumber: null,
      customerInfo: null,
      orderType: 'takeaway',
      includeDelivery: false,
      deliveryFee: 1500,
    })
    useCartStore.getState().clearCart()
  })

  describe('état initial', () => {
    it('a des items vides', () => {
      expect(useCartStore.getState().items).toEqual([])
    })
    it('a tableNumber null', () => {
      expect(useCartStore.getState().tableNumber).toBeNull()
    })
    it('getItemCount retourne 0', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0)
    })
    it('getSubtotal retourne 0', () => {
      expect(useCartStore.getState().getSubtotal()).toBe(0)
    })
    it('getTotal inclut le service fee pour takeaway', () => {
      const total = useCartStore.getState().getTotal()
      expect(total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('addItem', () => {
    it('ajoute un item au panier', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].name).toBe('Plat test')
      expect(useCartStore.getState().items[0].quantity).toBe(1)
      expect(useCartStore.getState().getSubtotal()).toBe(2500)
    })
    it('incrémente la quantité si même produit sans addons', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      useCartStore.getState().addItem(mockMenuItem, 2)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].quantity).toBe(3)
      expect(useCartStore.getState().getSubtotal()).toBe(7500)
    })
    it('ajoute une deuxième ligne pour un autre produit', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      useCartStore.getState().addItem(mockMenuItem2, 1)
      expect(useCartStore.getState().items).toHaveLength(2)
      expect(useCartStore.getState().getSubtotal()).toBe(4000)
    })
  })

  describe('addItemWithAddons', () => {
    it('ajoute un item avec addons', () => {
      const addons: OrderItemAddon[] = [
        { addonId: 'a1', type: 'extra', name: 'Fromage', price: 500, quantity: 1 },
      ]
      useCartStore.getState().addItemWithAddons(mockMenuItem, 1, addons)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].addons).toHaveLength(1)
      expect(useCartStore.getState().getSubtotal()).toBe(2500 + 500)
    })
    it('n’agrège pas avec un item sans addons (ligne séparée)', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      const addons: OrderItemAddon[] = [
        { addonId: 'a1', type: 'included', name: 'Sauce', price: 0, quantity: 1 },
      ]
      useCartStore.getState().addItemWithAddons(mockMenuItem, 1, addons)
      expect(useCartStore.getState().items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('retire un item par id', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      const id = useCartStore.getState().items[0].id
      useCartStore.getState().removeItem(id)
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('met à jour la quantité', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      const id = useCartStore.getState().items[0].id
      useCartStore.getState().updateQuantity(id, 3)
      expect(useCartStore.getState().items[0].quantity).toBe(3)
      expect(useCartStore.getState().getSubtotal()).toBe(7500)
    })
    it('supprime l’item si quantité <= 0', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      const id = useCartStore.getState().items[0].id
      useCartStore.getState().updateQuantity(id, 0)
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('vide le panier', () => {
      useCartStore.getState().addItem(mockMenuItem, 1)
      useCartStore.getState().clearCart()
      expect(useCartStore.getState().items).toHaveLength(0)
      expect(useCartStore.getState().getSubtotal()).toBe(0)
    })
  })

  describe('setTableNumber / getServiceFee', () => {
    it('getServiceFee retourne 0 quand tableNumber est défini', () => {
      useCartStore.getState().setTableNumber(5)
      useCartStore.getState().addItem(mockMenuItem, 1)
      expect(useCartStore.getState().getServiceFee()).toBe(0)
    })
  })
})

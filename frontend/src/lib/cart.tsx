import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CartItem {
  menuId: number
  name: string
  price: string
  quantity: number
}

export interface CartRestaurant {
  id: number
  name: string
}

interface AddMenu {
  id: number
  name: string
  price: string
}

interface CartContextValue {
  restaurant: CartRestaurant | null
  items: CartItem[]
  count: number
  total: number
  addItem: (menu: AddMenu, restaurant: CartRestaurant) => boolean
  setQuantity: (menuId: number, quantity: number) => void
  removeItem: (menuId: number) => void
  clear: () => void
}

const STORAGE_KEY = 'rk_cart'

const CartContext = createContext<CartContextValue | null>(null)

interface StoredCart {
  restaurant: CartRestaurant | null
  items: CartItem[]
}

function readStoredCart(): StoredCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as StoredCart) : null
    return parsed && Array.isArray(parsed.items) ? parsed : { restaurant: null, items: [] }
  } catch {
    return { restaurant: null, items: [] }
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const initial = readStoredCart()
  const [restaurant, setRestaurant] = useState<CartRestaurant | null>(initial.restaurant)
  const [items, setItems] = useState<CartItem[]>(initial.items)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ restaurant, items }))
  }, [restaurant, items])

  const value = useMemo<CartContextValue>(
    () => ({
      restaurant,
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      total: items.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
      addItem(menu, newRestaurant) {
        setRestaurant(newRestaurant)
        if (restaurant && restaurant.id !== newRestaurant.id && items.length > 0) {
          setItems([{ menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }])
          return true
        }
        setItems((prev) => {
          const existing = prev.find((i) => i.menuId === menu.id)
          if (existing) {
            return prev.map((i) => (i.menuId === menu.id ? { ...i, quantity: i.quantity + 1 } : i))
          }
          return [...prev, { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }]
        })
        return true
      },
      setQuantity(menuId, quantity) {
        if (quantity <= 0) {
          setItems((prev) => prev.filter((i) => i.menuId !== menuId))
          return
        }
        setItems((prev) => prev.map((i) => (i.menuId === menuId ? { ...i, quantity } : i)))
      },
      removeItem(menuId) {
        setItems((prev) => prev.filter((i) => i.menuId !== menuId))
      },
      clear() {
        setRestaurant(null)
        setItems([])
      },
    }),
    [restaurant, items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

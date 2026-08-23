import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Leaf, MapPin, Plus, ShoppingBag, Store } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Button, Card, Spinner } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency } from '../lib/format'
import { useCart } from '../lib/cart'

interface PublicRestaurant {
  id: number
  name: string
  address: string
  menu_count: number
}

interface PublicMenu {
  id: number
  restaurant: number
  name: string
  description: string | null
  price: string
  is_available: boolean
  is_vegetarian: boolean
}

export default function RestaurantMenu() {
  const { id } = useParams<{ id: string }>()
  const { addItem, restaurant: cartRestaurant, items, count, total } = useCart()
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null)
  const [menus, setMenus] = useState<PublicMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartNote, setCartNote] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setCartNote('')
    Promise.all([
      api(`/api/public/restaurants/${id}/`),
      api(`/api/public/restaurants/${id}/menus/`),
    ])
      .then(([r, m]: [PublicRestaurant, PublicMenu[]]) => {
        setRestaurant(r)
        setMenus(m)
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  function handleAdd(menu: PublicMenu) {
    if (!restaurant) return
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      if (
        !window.confirm(
          'Your cart has items from another restaurant. Start a new cart for this restaurant?',
        )
      )
        return
    }
    const accepted = addItem(menu, { id: restaurant.id, name: restaurant.name })
    if (accepted) {
      setCartNote(`Added "${menu.name}" to your cart.`)
      window.setTimeout(() => setCartNote(''), 2500)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Card className="p-8">
          <p className="text-sm font-medium text-rose-600">{error || 'Restaurant not found.'}</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="secondary">Browse restaurants</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> All kitchens
      </Link>

      {/* Restaurant header */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-rose-600">
          <Store className="size-12 text-white/90" />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{restaurant.name}</h1>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
              <MapPin className="mt-0.5 size-4 shrink-0" /> {restaurant.address}
            </p>
          </div>
          <Badge tone="success">{menus.length} available dishes</Badge>
        </div>
      </div>

      {cartNote && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {cartNote}
        </div>
      )}

      {/* Menu items */}
      <h2 className="mt-10 text-xl font-bold tracking-tight text-slate-900">Menu</h2>
      {menus.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={ShoppingBag}
            title="No dishes available"
            description="This restaurant hasn't published any dishes yet."
          />
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {menus.map((m) => (
            <Card key={m.id} className="flex items-start justify-between gap-4 p-5 transition hover:shadow-md">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{m.name}</h3>
                  {m.is_vegetarian && (
                    <Badge tone="info">
                      <Leaf className="size-3" /> Veg
                    </Badge>
                  )}
                </div>
                {m.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.description}</p>
                )}
                <p className="mt-3 text-base font-bold text-slate-900">{formatCurrency(m.price)}</p>
              </div>
              <Button size="sm" onClick={() => handleAdd(m)} className="shrink-0">
                <Plus className="size-4" /> Add
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Floating cart summary */}
      {items.length > 0 && (
        <div className="sticky bottom-4 z-20 mt-10">
          <Link
            to="/cart"
            className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-stone-900 px-5 py-3.5 text-white shadow-2xl transition hover:bg-stone-800"
          >
            <span className="inline-flex items-center gap-2.5 text-sm font-semibold">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold">
                {count}
              </span>
              {cartRestaurant?.name} · View cart
            </span>
            <span className="text-base font-bold">{formatCurrency(total)}</span>
          </Link>
        </div>
      )}
    </div>
  )
}

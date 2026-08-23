import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { api } from '../lib/api'
import { Button, Card } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency } from '../lib/format'

export default function Cart() {
  const { user } = useAuth()
  const { restaurant, items, setQuantity, removeItem, total, clear } = useCart()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  async function placeOrder() {
    if (!user) return
    if (!restaurant || items.length === 0) return
    setPlacing(true)
    setError('')
    try {
      const order = await api('/api/orders/', {
        method: 'POST',
        body: JSON.stringify({
          restaurant: restaurant.id,
          items: items.map((i) => ({ menu: i.menuId, quantity: i.quantity })),
        }),
      })
      clear()
      navigate(`/payment/process?order=${order.id}`)
    } catch (err) {
      setError((err as Error).message || 'Unable to place order.')
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your cart</h1>
        <Card className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse restaurants and add dishes to get started."
            action={
              <Link to="/">
                <Button>
                  Browse restaurants <ArrowRight className="size-4" />
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your cart</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ordering from <span className="font-semibold text-slate-800">{restaurant?.name}</span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-0 lg:col-span-2">
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.menuId} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(item.menuId, item.quantity - 1)}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(item.menuId, item.quantity + 1)}
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="w-20 text-right font-semibold text-slate-900">
                  {formatCurrency(Number(item.price) * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.menuId)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Items</dt>
                <dd>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Delivery</dt>
                <dd className="font-semibold text-emerald-600">Free</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="text-xl font-bold text-slate-900">{formatCurrency(total)}</dd>
              </div>
            </dl>

            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            {user ? (
              <Button className="mt-5 w-full" size="lg" onClick={placeOrder} loading={placing}>
                Place order
              </Button>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">Sign in to place your order.</span> You only need
                  an account when you're ready to check out.
                </div>
                <Link to="/login?next=/cart" className="block">
                  <Button className="w-full" size="lg">
                    <Lock className="size-4" /> Sign in to order
                  </Button>
                </Link>
                <Link to="/register?next=/cart" className="block">
                  <Button variant="secondary" className="w-full">
                    Create an account
                  </Button>
                </Link>
              </div>
            )}
          </Card>
          <Button variant="ghost" className="w-full" onClick={clear}>
            Clear cart
          </Button>
        </div>
      </div>
    </div>
  )
}

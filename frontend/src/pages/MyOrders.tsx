import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Package } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Button, Card, Spinner } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, formatDateTime } from '../lib/format'

interface OrderedItem {
  id: number
  menu: { id: number; name: string; price: string }
  quantity: number
  subtotal: string
}

interface Order {
  id: number
  user_email: string
  restaurant_name: string
  ordered_items: OrderedItem[]
  payment_status: boolean
  total_price: string
  created_at: string
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/orders/mine/')
      .then(setOrders)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">My orders</h1>
      <p className="mt-1 text-sm text-slate-500">Track your orders and payments.</p>

      {error && (
        <Card className="mt-6 p-8 text-center text-sm text-rose-600">{error}</Card>
      )}

      {!error && orders.length === 0 && (
        <Card className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order, it will show up here."
            action={
              <Link to="/">
                <Button>Browse restaurants</Button>
              </Link>
            }
          />
        </Card>
      )}

      {orders.length > 0 && (
        <div className="mt-8 space-y-5">
          {orders.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-slate-900">Order #{o.id}</h2>
                    <Badge tone={o.payment_status ? 'success' : 'pending'}>
                      {o.payment_status ? 'Paid' : 'Payment pending'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {o.restaurant_name} · {formatDateTime(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(o.total_price)}
                  </span>
                  {!o.payment_status && (
                    <Link to={`/payment/process?order=${o.id}`}>
                      <Button size="sm" variant="success">
                        <CreditCard className="size-4" /> Pay now
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4">
                {o.ordered_items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      <span className="font-medium text-slate-800">{item.menu.name}</span>{' '}
                      <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

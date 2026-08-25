import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Card, Select, Spinner } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, formatDateTime } from '../lib/format'
import { orderStatusInfo } from '../lib/orderStatus'

interface Restaurant {
  id: number
  name: string
}

interface OrderedItem {
  id: number
  menu: { id: number; name: string; price: string }
  quantity: number
  subtotal: string
}

interface Order {
  id: number
  user_email: string
  restaurant: number
  restaurant_name: string
  ordered_items: OrderedItem[]
  payment_status: boolean
  status: string
  total_price: string
  created_at: string
}

export default function Orders() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/restaurants/')
      .then((data: Restaurant[]) => {
        setRestaurants(data)
        setSelectedId(String(data[0]?.id ?? ''))
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const fetchOrders = useCallback(async (restaurantId: string) => {
    if (!restaurantId) {
      setOrders([])
      return
    }
    setLoadingOrders(true)
    try {
      const data = await api(`/api/orders/?restaurant=${restaurantId}`)
      setOrders(data as Order[])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchOrders(selectedId)
  }, [selectedId, fetchOrders])

  const selected = useMemo(
    () => restaurants.find((r) => String(r.id) === selectedId),
    [restaurants, selectedId],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track incoming orders and payments.</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <Select label="Restaurant" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {restaurants.length === 0 && <option value="">No restaurants found</option>}
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Card>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {loadingOrders ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <EmptyState
                icon={ClipboardList}
                title="No orders yet"
                description={
                  selected
                    ? `Orders placed at ${selected.name} will show up here.`
                    : 'Create a restaurant first to receive orders.'
                }
              />
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-semibold">Order</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold">Items</th>
                      <th className="px-6 py-3 font-semibold">Total</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Payment</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">#{o.id}</td>
                        <td className="px-6 py-4 text-slate-700">{o.user_email}</td>
                        <td className="px-6 py-4 text-slate-600">
                          <ul className="space-y-0.5">
                            {o.ordered_items.map((item) => (
                              <li key={item.id}>
                                <span className="font-medium text-slate-800">{item.menu.name}</span>{' '}
                                <span className="text-slate-400">× {item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatCurrency(o.total_price)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={orderStatusInfo(o.status).tone}>
                            {orderStatusInfo(o.status).label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={o.payment_status ? 'success' : 'pending'}>
                            {o.payment_status ? 'Paid' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{formatDateTime(o.created_at)}</td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/app/orders/${o.id}`}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

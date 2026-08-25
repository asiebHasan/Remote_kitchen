import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Button, Card, Select, Spinner } from '../components/ui'
import { formatCurrency, formatDateTime } from '../lib/format'
import { ORDER_STATUS_KEYS, orderStatusInfo } from '../lib/orderStatus'

interface OrderedItem {
  id: number
  menu: { id: number; name: string; price: string; is_vegetarian: boolean }
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

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savedNote, setSavedNote] = useState('')

  useEffect(() => {
    api(`/api/orders/${id}/`)
      .then(setOrder)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusChange(nextStatus: string) {
    if (!order || nextStatus === order.status) return
    setSavingStatus(true)
    setError('')
    setSavedNote('')
    try {
      const updated = await api<Order>(`/api/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setOrder(updated)
      setSavedNote(`Status updated to "${orderStatusInfo(nextStatus).label}".`)
      window.setTimeout(() => setSavedNote(''), 2500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingStatus(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete order #${id}?`)) return
    setDeleting(true)
    try {
      await api(`/api/orders/${id}/`, { method: 'DELETE' })
      navigate('/app/orders')
    } catch (err) {
      setError((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-rose-600">{error || 'Order not found.'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/orders')}>
          Back to orders
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Orders
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order #{order.id}</h1>
            <Badge tone={orderStatusInfo(order.status).tone}>
              {orderStatusInfo(order.status).label}
            </Badge>
            <Badge tone={order.payment_status ? 'success' : 'pending'}>
              {order.payment_status ? 'Paid' : 'Payment pending'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Placed on {formatDateTime(order.created_at)} by {order.user_email}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            <Trash2 className="size-4" /> Delete order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</p>
          <p className="mt-1.5 font-semibold text-slate-900">{order.user_email}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Restaurant</p>
          <p className="mt-1.5 font-semibold text-slate-900">{order.restaurant_name}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">{formatCurrency(order.total_price)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order status</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            className="sm:w-56"
            value={order.status}
            disabled={savingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {ORDER_STATUS_KEYS.map((key) => (
              <option key={key} value={key}>
                {orderStatusInfo(key).label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-slate-500">
            Keep customers informed as the order is prepared and delivered.
          </p>
        </div>
        {savedNote && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> {savedNote}
          </p>
        )}
      </Card>

      <Card>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Ordered items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Item</th>
                <th className="px-6 py-3 font-semibold">Unit price</th>
                <th className="px-6 py-3 font-semibold">Qty</th>
                <th className="px-6 py-3 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.ordered_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3.5 font-medium text-slate-900">
                    {item.menu.name}
                    {item.menu.is_vegetarian && (
                      <span className="ml-2 text-xs font-semibold text-emerald-600">Veg</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{formatCurrency(item.menu.price)}</td>
                  <td className="px-6 py-3.5 text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="px-6 py-4 text-right font-semibold text-slate-700">
                  Total
                </td>
                <td className="px-6 py-4 text-right text-base font-bold text-slate-900">
                  {formatCurrency(order.total_price)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

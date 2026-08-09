import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Clock,
  Store,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { api } from '../lib/api'
import { StatCard } from '../components/StatCard'
import { Badge, Card, Spinner } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency, formatDateTime } from '../lib/format'

interface RecentOrder {
  id: number
  user_email: string
  restaurant_name: string
  total_price: string
  payment_status: boolean
  item_count: number
  created_at: string
}

interface Stats {
  restaurants: number
  menus: number
  orders: number
  employees: number
  revenue: string
  pending_orders: number
  recent_orders: RecentOrder[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/dashboard/stats/')
      .then(setStats)
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

  if (error || !stats) {
    return (
      <Card className="p-8 text-center text-sm text-rose-600">
        {error || 'Unable to load dashboard.'}
      </Card>
    )
  }

  const cards = [
    { label: 'Restaurants', value: stats.restaurants, icon: Store, tone: 'indigo' as const },
    { label: 'Menu Items', value: stats.menus, icon: UtensilsCrossed, tone: 'sky' as const },
    { label: 'Total Orders', value: stats.orders, icon: ClipboardList, tone: 'violet' as const },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: Banknote, tone: 'emerald' as const },
    { label: 'Employees', value: stats.employees, icon: Users, tone: 'amber' as const },
    { label: 'Pending Orders', value: stats.pending_orders, icon: Clock, tone: 'rose' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">An overview of your restaurant business.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent orders</h2>
          <Link
            to="/app/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {stats.recent_orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Orders placed at your restaurants will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Restaurant</th>
                  <th className="px-6 py-3 font-semibold">Items</th>
                  <th className="px-6 py-3 font-semibold">Total</th>
                  <th className="px-6 py-3 font-semibold">Payment</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">#{o.id}</td>
                    <td className="px-6 py-3.5 text-slate-700">{o.user_email}</td>
                    <td className="px-6 py-3.5 text-slate-700">{o.restaurant_name}</td>
                    <td className="px-6 py-3.5 text-slate-700">{o.item_count}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {formatCurrency(o.total_price)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge tone={o.payment_status ? 'success' : 'pending'}>
                        {o.payment_status ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

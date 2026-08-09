import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Search, Store, UtensilsCrossed } from 'lucide-react'
import { api } from '../lib/api'
import { Card, Spinner } from '../components/ui'
import { EmptyState } from '../components/EmptyState'

interface PublicRestaurant {
  id: number
  name: string
  address: string
  created_at: string
  menu_count: number
}

export default function Landing() {
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api('/api/public/restaurants/')
      .then(setRestaurants)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = restaurants.filter((r) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-200">
              <Store className="size-3.5" /> Browse before you sign in
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Order from the best restaurants near you.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Explore menus from every partner restaurant. Sign in only when you're ready to place
              your order.
            </p>
            <div className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
              <Search className="ml-2 size-5 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants or locations..."
                className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Restaurants</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} available {filtered.length === 1 ? 'restaurant' : 'restaurants'}
              {query ? ' matching your search' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center text-sm text-rose-600">{error}</Card>
        ) : filtered.length === 0 ? (
          <Card className="mt-6">
            <EmptyState
              icon={Store}
              title={query ? 'No restaurants match your search' : 'No restaurants yet'}
              description={
                query
                  ? 'Try a different search term.'
                  : 'Restaurants will appear here once they join.'
              }
            />
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Link key={r.id} to={`/restaurants/${r.id}`} className="group">
                <Card className="h-full overflow-hidden p-0 transition group-hover:shadow-lg">
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700">
                    <Store className="size-10 text-white/90 transition group-hover:scale-110" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
                        {r.name}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <UtensilsCrossed className="size-3" /> {r.menu_count} dishes
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-slate-500">
                      <MapPin className="mt-0.5 size-4 shrink-0" /> {r.address}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                      View menu <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

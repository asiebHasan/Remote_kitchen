import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Pencil, Plus, Store, Trash2, UtensilsCrossed } from 'lucide-react'
import { api } from '../lib/api'
import { Button, Card, Input, Spinner } from '../components/ui'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { formatDate } from '../lib/format'

interface Restaurant {
  id: number
  name: string
  address: string
  owner: number
  created_at: string
}

interface RestaurantForm {
  name: string
  address: string
}

const emptyForm: RestaurantForm = { name: '', address: '' }

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<RestaurantForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/api/restaurants/')
      setRestaurants(data as Restaurant[])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) {
      setFormError('Name and address are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api('/api/restaurants/', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setModalOpen(false)
      setForm(emptyForm)
      fetchRestaurants()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this restaurant? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api(`/api/restaurants/${id}/`, { method: 'DELETE' })
      fetchRestaurants()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Restaurants</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the cloud kitchens you own.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Add restaurant
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : restaurants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Store}
            title="No restaurants yet"
            description="Create your first restaurant to start building menus and taking orders."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="size-4" /> Add restaurant
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Card key={r.id} className="flex flex-col p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                  <Store className="size-6" />
                </div>
                <div className="flex gap-1">
                  <Link
                    to={`/app/restaurants/${r.id}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                    title="Edit"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">{r.name}</h3>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {r.address}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">Added {formatDate(r.created_at)}</span>
                <Link
                  to={`/app/menus?restaurant=${r.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <UtensilsCrossed className="size-3.5" /> Menus
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a restaurant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button form="restaurant-form" type="submit" loading={saving}>
              Create restaurant
            </Button>
          </>
        }
      >
        <form id="restaurant-form" onSubmit={handleCreate} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formError}
            </div>
          )}
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. The Golden Fork"
            required
          />
          <Input
            label="Address"
            name="address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="e.g. 12 Elm Street, Springfield"
            required
          />
        </form>
      </Modal>
    </div>
  )
}

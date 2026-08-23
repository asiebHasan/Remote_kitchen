import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Leaf, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Button, Card, Input, Select, Spinner, Textarea } from '../components/ui'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { formatCurrency } from '../lib/format'

interface Restaurant {
  id: number
  name: string
}

interface Menu {
  id: number
  restaurant: number
  name: string
  description: string | null
  price: string
  is_available: boolean
  is_vegetarian: boolean
}

interface MenuForm {
  id?: number
  name: string
  description: string
  price: string
  is_available: boolean
  is_vegetarian: boolean
}

const emptyForm: MenuForm = {
  name: '',
  description: '',
  price: '',
  is_available: true,
  is_vegetarian: false,
}

export default function Menus() {
  const [searchParams] = useSearchParams()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<MenuForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    api('/api/restaurants/')
      .then((data: Restaurant[]) => {
        setRestaurants(data)
        const fromUrl = searchParams.get('restaurant')
        const initial = fromUrl && data.some((r) => String(r.id) === fromUrl) ? fromUrl : String(data[0]?.id ?? '')
        setSelectedId(initial)
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchMenus = useCallback(async (restaurantId: string) => {
    if (!restaurantId) {
      setMenus([])
      return
    }
    setLoadingMenus(true)
    try {
      const data = await api(`/api/menus/?restaurant=${restaurantId}`)
      setMenus(data as Menu[])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingMenus(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchMenus(selectedId)
  }, [selectedId, fetchMenus])

  const selected = useMemo(
    () => restaurants.find((r) => String(r.id) === selectedId),
    [restaurants, selectedId],
  )

  function openCreate() {
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(menu: Menu) {
    setForm({
      id: menu.id,
      name: menu.name,
      description: menu.description ?? '',
      price: menu.price,
      is_available: menu.is_available,
      is_vegetarian: menu.is_vegetarian,
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) {
      setFormError('Name and price are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: form.price,
        is_available: form.is_available,
        is_vegetarian: form.is_vegetarian,
      }
      if (form.id) {
        await api(`/api/menus/${form.id}/`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await api('/api/menus/', {
          method: 'POST',
          body: JSON.stringify({ ...body, restaurant: selectedId }),
        })
      }
      setModalOpen(false)
      fetchMenus(selectedId)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this menu item?')) return
    setDeletingId(id)
    try {
      await api(`/api/menus/${id}/`, { method: 'DELETE' })
      fetchMenus(selectedId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedId(e.target.value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Menus</h1>
          <p className="mt-1 text-sm text-slate-500">Curate the dishes served at each restaurant.</p>
        </div>
        <Button onClick={openCreate} disabled={!selectedId}>
          <Plus className="size-4" /> Add menu item
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <Card className="p-4 sm:p-5">
            <Select label="Restaurant" value={selectedId} onChange={handleSelectChange}>
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

          {loadingMenus ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : menus.length === 0 ? (
            <Card>
              <EmptyState
                icon={UtensilsCrossed}
                title="No menu items yet"
                description={
                  selected
                    ? `Add your first dish to ${selected.name}.`
                    : 'Create a restaurant first to build its menu.'
                }
                action={
                  selected ? (
                    <Button onClick={openCreate}>
                      <Plus className="size-4" /> Add menu item
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menus.map((m) => (
                <Card key={m.id} className="flex flex-col p-5 transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white">
                      <UtensilsCrossed className="size-5" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{m.name}</h3>
                    <span className="shrink-0 text-lg font-bold text-slate-900">
                      {formatCurrency(m.price)}
                    </span>
                  </div>
                  {m.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{m.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Badge tone={m.is_available ? 'success' : 'neutral'}>
                      {m.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                    {m.is_vegetarian && (
                      <Badge tone="info">
                        <Leaf className="size-3" /> Vegetarian
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit menu item' : 'Add a menu item'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button form="menu-form" type="submit" loading={saving}>
              {form.id ? 'Save changes' : 'Add item'}
            </Button>
          </>
        }
      >
        <form id="menu-form" onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="e.g. Margherita Pizza"
            required
          />
          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Short description of the dish"
            rows={3}
          />
          <Input
            label="Price ($)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            placeholder="0.00"
            required
          />
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.is_vegetarian}
                onChange={(e) => setForm((p) => ({ ...p, is_vegetarian: e.target.checked }))}
                className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Vegetarian
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}

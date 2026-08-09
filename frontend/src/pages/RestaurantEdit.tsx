import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Store } from 'lucide-react'
import { api } from '../lib/api'
import { Button, Card, Input, Spinner } from '../components/ui'

export default function RestaurantEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/restaurants/${id}/`)
      .then((r) => setForm({ name: r.name, address: r.address }))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api(`/api/restaurants/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      navigate('/app/restaurants')
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/app/restaurants"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Restaurants
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit restaurant</h1>
        <p className="mt-1 text-sm text-slate-500">Update the details of this venue.</p>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
            <Store className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">#{id}</p>
            <p className="text-sm text-slate-500">Restaurant identifier</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Address"
            name="address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => navigate('/app/restaurants')}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

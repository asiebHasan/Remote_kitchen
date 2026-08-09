import { useCallback, useEffect, useMemo, useState } from 'react'
import { Mail, Plus, Users } from 'lucide-react'
import { api } from '../lib/api'
import { Button, Card, Input, Select, Spinner } from '../components/ui'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { formatDate } from '../lib/format'

interface Restaurant {
  id: number
  name: string
}

interface Employee {
  id: number
  employee_id: number
  username: string
  email: string
  date_joined: string
  restaurant: number
  restaurant_name: string
}

const emptyForm = { username: '', email: '', password: '' }

export default function Employees() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api('/api/restaurants/')
      .then((data: Restaurant[]) => {
        setRestaurants(data)
        setSelectedId(String(data[0]?.id ?? ''))
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const fetchEmployees = useCallback(async (restaurantId: string) => {
    if (!restaurantId) {
      setEmployees([])
      return
    }
    setLoadingEmployees(true)
    try {
      const data = await api(`/api/employees/?restaurant=${restaurantId}`)
      setEmployees(data as Employee[])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchEmployees(selectedId)
  }, [selectedId, fetchEmployees])

  const selected = useMemo(
    () => restaurants.find((r) => String(r.id) === selectedId),
    [restaurants, selectedId],
  )

  function openModal() {
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.username.trim()) next.username = 'Username is required'
    if (!form.email.trim()) next.email = 'Email is required'
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    setFormErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await api('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          is_employee: true,
          restaurant_id: Number(selectedId),
        }),
      })
      setModalOpen(false)
      fetchEmployees(selectedId)
    } catch (err) {
      setFormErrors({ form: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the team across your restaurants.</p>
        </div>
        <Button onClick={openModal} disabled={!selectedId}>
          <Plus className="size-4" /> Add employee
        </Button>
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

          {loadingEmployees ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : employees.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No employees yet"
                description={
                  selected
                    ? `Add your first team member to ${selected.name}.`
                    : 'Create a restaurant first to add employees.'
                }
                action={
                  selected ? (
                    <Button onClick={openModal}>
                      <Plus className="size-4" /> Add employee
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Restaurant</th>
                      <th className="px-6 py-3 font-semibold">Date joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
                              {emp.username[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900">{emp.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <Mail className="size-3.5" /> {emp.email}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">{emp.restaurant_name}</td>
                        <td className="px-6 py-3.5 text-slate-500">{formatDate(emp.date_joined)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add an employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button form="employee-form" type="submit" loading={saving}>
              Create employee
            </Button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} className="space-y-5">
          {formErrors.form && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formErrors.form}
            </div>
          )}
          {selected && (
            <p className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
              Assigning to <span className="font-semibold text-slate-900">{selected.name}</span>
            </p>
          )}
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            error={formErrors.username}
            required
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={formErrors.email}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={formErrors.password}
            hint="At least 6 characters"
            required
          />
        </form>
      </Modal>
    </div>
  )
}

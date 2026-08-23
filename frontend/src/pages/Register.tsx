import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Button, Input } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'owner' ? 'owner' : 'customer'
  const next = searchParams.get('next')

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: '', username: '', email: '' }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validation: Record<string, string> = {}
    if (!form.username) validation.username = 'Username is required'
    if (!form.email) validation.email = 'Email is required'
    if (form.password.length < 6) validation.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) validation.confirm = 'Passwords do not match'
    setErrors(validation)
    if (Object.keys(validation).length) return

    setLoading(true)
    try {
      const user = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        is_owner: role === 'owner',
        is_customer: role === 'customer',
      })
      const home = user.is_owner || user.is_employee ? '/app' : next || '/'
      navigate(home)
    } catch (err) {
      setErrors({ form: (err as Error).message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  const isOwnerMode = role === 'owner'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-900 via-stone-900 to-brand-950 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-900/50">
            <ChefHat className="size-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isOwnerMode ? 'Create your owner account' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-brand-200/80">
              {isOwnerMode
                ? 'Set up your cloud kitchen management profile.'
                : 'Just browsing is free — sign up when you are ready to order.'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.form && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {errors.form}
              </div>
            )}
            <Input
              label="Username"
              name="username"
              value={form.username}
              onChange={set('username')}
              placeholder="your username"
              error={errors.username}
              required
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              error={errors.email}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="at least 6 characters"
              error={errors.password}
              required
            />
            <Input
              label="Confirm password"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="repeat password"
              error={errors.confirm}
              required
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {isOwnerMode ? 'Create owner account' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-semibold text-brand-300 hover:text-brand-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

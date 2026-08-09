import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChefHat, ClipboardList, Store, Users } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Button, Input } from '../components/ui'

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg">
            <ChefHat className="size-7 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Remote Kitchen</p>
            <p className="text-sm text-indigo-300/80">Restaurant Manager</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Run your restaurants from one beautiful dashboard.
          </h1>
          <div className="space-y-4">
            {[
              { icon: Store, title: 'Manage restaurants', desc: 'Add and update your venues in seconds.' },
              { icon: Users, title: 'Grow your team', desc: 'Onboard employees across every location.' },
              { icon: ClipboardList, title: 'Track every order', desc: 'Follow orders and payments in real time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-indigo-300" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-300/80">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-slate-400">© {new Date().getFullYear()} Remote Kitchen</p>
      </div>

      <div className="flex w-full items-center justify-center bg-slate-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      const next = searchParams.get('next')
      const home = user.is_owner || user.is_employee ? '/app' : '/'
      navigate(next || home, { replace: true })
    } catch (err) {
      setError((err as Error).message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-8 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600">
            <ChefHat className="size-6 text-white" />
          </div>
          <p className="text-lg font-bold text-slate-900">Remote Kitchen</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}
        <Input
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your username"
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        Are you a restaurant owner?{' '}
        <Link
          to="/register?role=owner"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Create an owner account
        </Link>
      </p>
    </AuthShell>
  )
}

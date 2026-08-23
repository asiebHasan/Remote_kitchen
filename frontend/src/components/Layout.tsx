import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/restaurants', label: 'Restaurants', icon: Store, end: false },
  { to: '/app/menus', label: 'Menus', icon: UtensilsCrossed, end: false },
  { to: '/app/employees', label: 'Employees', icon: Users, end: false },
  { to: '/app/orders', label: 'Orders', icon: ClipboardList, end: false },
]

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-900/40">
        <ChefHat className="size-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-white">Remote Kitchen</p>
        <p className="text-xs font-medium text-brand-200/80">Cloud Kitchen Manager</p>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-6">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-brand-200/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
            {(user?.username?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.username}</p>
            <p className="truncate text-xs text-brand-200/80">
              {user?.is_owner ? 'Owner' : user?.is_employee ? 'Employee' : 'User'}
            </p>
          </div>
          <Link
            to="/"
            onClick={async (e) => {
              e.preventDefault()
              await logout()
              if (onNavigate) onNavigate()
              window.location.href = '/'
            }}
            className="rounded-lg p-1.5 text-brand-200/80 transition hover:bg-white/10 hover:text-white"
            title="Log out"
          >
            <LogOut className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-gradient-to-b from-stone-900 via-stone-900 to-brand-950 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-stone-900 via-stone-900 to-brand-950 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-brand-200/80 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="hidden sm:inline">Welcome back,</span>
            <span className="font-semibold text-slate-800">{user?.username}</span>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

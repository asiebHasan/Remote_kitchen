import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ChefHat, LogIn, LogOut, Package, ShoppingBag, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import AssistantWidget from './AssistantWidget'

function PublicHeader() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <ChefHat className="size-6" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight text-slate-900">Remote Kitchen</p>
            <p className="text-xs text-slate-500">Cloud kitchens, delivered hot.</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Restaurants
          </NavLink>
          {user && (
            <NavLink to="/my-orders" className={linkClass}>
              My orders
            </NavLink>
          )}
          {user && (user.is_owner || user.is_employee) && (
            <Link to="/app" className={linkClass({ isActive: false })}>
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="size-4" /> Admin
              </span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative rounded-lg p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            title="Cart"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 md:inline-flex">
                <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
                  {user.username[0]?.toUpperCase()}
                </span>
                {user.username}
              </span>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              <LogIn className="size-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <ChefHat className="size-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Remote Kitchen</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800">
            Restaurants
          </Link>
          <Link to="/my-orders" className="hover:text-slate-800">
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4" /> My orders
            </span>
          </Link>
          <Link to="/app" className="hover:text-slate-800">
            Owner panel
          </Link>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Remote Kitchen</p>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <AssistantWidget />
    </div>
  )
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'

export interface User {
  id: number
  username: string
  email: string
  is_owner: boolean
  is_employee: boolean
  is_customer: boolean
  first_name: string
  last_name: string
  date_joined: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
  is_owner?: boolean
  is_customer?: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

const STORAGE_KEY = 'rk_user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api<User>('/api/auth/me/')
      .then((u) => {
        if (!active) return
        setUser(u)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(username, password) {
        const u = await api<User>('/api/auth/login/', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        })
        setUser(u)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
        return u
      },
      async register(input) {
        const data = await api<{ status: string; user: User }>('/api/auth/register/', {
          method: 'POST',
          body: JSON.stringify(input),
        })
        setUser(data.user)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
        return data.user
      },
      async logout() {
        try {
          await api('/api/auth/logout/', { method: 'POST' })
        } catch {
          // ignore
        }
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

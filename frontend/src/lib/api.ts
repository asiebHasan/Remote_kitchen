function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

let csrfPromise: Promise<string | null> | null = null

function getCsrfToken(): Promise<string | null> {
  if (!csrfPromise) {
    csrfPromise = fetch('/api/auth/csrf/', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => d.csrfToken ?? null)
      .catch(() => null)
  }
  return csrfPromise
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    let token = readCookie('csrftoken')
    if (!token) {
      await getCsrfToken()
      token = readCookie('csrftoken')
    }
    if (token) headers.set('X-CSRFToken', token)
  }

  const res = await fetch(path, { ...options, headers, credentials: 'same-origin' })

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const obj = data as Record<string, unknown> | null
    const message =
      (typeof obj?.error === 'string' && obj.error) ||
      (typeof obj?.detail === 'string' && obj.detail) ||
      (typeof obj?.message === 'string' && obj.message) ||
      (typeof data === 'string' ? data : `Request failed (${res.status})`)
    throw new Error(message)
  }

  return data as T
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Crosshair,
  LocateFixed,
  MapPin,
  MessageCircle,
  Send,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { Badge } from './ui'
import { formatCurrency } from '../lib/format'

interface AssistantItem {
  menu_id: number
  name: string
  description: string | null
  price: string
  is_vegetarian: boolean
  restaurant_id: number
  restaurant_name: string
  restaurant_address: string
  distance_km: number | null
}

interface AssistantResponse {
  message: string
  items: AssistantItem[]
  needs_location: boolean
  suggestions: string[]
}

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  items?: AssistantItem[]
  needsLocation?: boolean
  suggestions?: string[]
}

interface GeoPoint {
  lat: number
  lng: number
}

const DEMO_LOCATION: GeoPoint = { lat: 39.78, lng: -89.65 }

let msgSeq = 0
const nextId = () => ++msgSeq

function DishCard({ item }: { item: AssistantItem }) {
  return (
    <Link
      to={`/restaurants/${item.restaurant_id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{item.name}</p>
            {item.is_vegetarian && (
              <Badge tone="info">
                <span className="text-[10px]">Veg</span>
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{item.restaurant_name}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-slate-900">
          {formatCurrency(item.price)}
        </span>
      </div>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-slate-400">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{item.restaurant_address}</span>
        </span>
        {item.distance_km != null && (
          <Badge tone="success">{item.distance_km} km</Badge>
        )}
      </div>
    </Link>
  )
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loc, setLoc] = useState<GeoPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function shareLocation() {
    setLocError('')
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported here.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocError('Could not get your location. Try the demo location.')
        setLocating(false)
      },
      { timeout: 8000 },
    )
  }

  async function runQuery(q: string, point: GeoPoint | null) {
    setSending(true)
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: q }])
    try {
      const body: Record<string, unknown> = { q }
      if (point) {
        body.lat = point.lat
        body.lng = point.lng
      }
      const res = await api<AssistantResponse>('/api/assistant/', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: res.message,
          items: res.items,
          needsLocation: res.needs_location,
          suggestions: res.suggestions,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: `Sorry, something went wrong: ${(err as Error).message}`,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || sending) return
    setInput('')
    runQuery(q, loc)
  }

  function handleNeedsLocation() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const q = lastUser?.text ?? ''
    setLocError('')
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported here.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLoc(point)
        setLocating(false)
        if (q) runQuery(q, point)
      },
      () => {
        setLocError('Could not get your location. Try the demo location.')
        setLocating(false)
      },
      { timeout: 8000 },
    )
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex h-[34rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-stone-900 to-brand-950 px-4 py-3.5 text-white">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand-600 shadow">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Kitchen Assistant</p>
                <p className="text-xs text-brand-200/80">
                  Ask about dishes, diets, or the closest restaurant.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-brand-200/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream px-3 py-4">
              {messages.length === 0 && (
                <div className="rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  <p className="font-semibold text-slate-800">Hello! Hungry?</p>
                  <p className="mt-1">
                    Tell me what you're craving — a dish, a cuisine, or a budget — and
                    I'll find the closest kitchen that has it.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white'
                        : 'max-w-[92%] space-y-2'
                    }
                  >
                    {m.role === 'assistant' ? (
                      <>
                        <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm">
                          {m.text}
                        </div>

                        {m.needsLocation && (
                          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm">
                            <p className="text-xs text-slate-500">
                              To find the closest match:
                            </p>
                            <button
                              onClick={handleNeedsLocation}
                              disabled={locating}
                              className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                            >
                              <LocateFixed className="size-3.5" />
                              {locating ? 'Locating…' : 'Share my location'}
                            </button>
                            {locError && (
                              <p className="mt-1 text-xs text-rose-600">{locError}</p>
                            )}
                          </div>
                        )}

                        {m.items && m.items.length > 0 && (
                          <div className="space-y-2">
                            {m.items.map((item) => (
                              <DishCard key={`${item.restaurant_id}-${item.menu_id}`} item={item} />
                            ))}
                          </div>
                        )}

                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => send(s)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-slate-400 shadow-sm">
                    Searching menus…
                  </div>
                </div>
              )}
            </div>

            {/* Location strip */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2">
              {loc ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <MapPin className="size-3.5" />
                  Location shared
                </span>
              ) : (
                <span className="text-xs text-slate-400">Optional: share your location for "closest" results</span>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={shareLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
                  title="Use my location"
                >
                  <Crosshair className="size-3.5" />
                  {locating ? '…' : 'My location'}
                </button>
                {!loc && (
                  <button
                    onClick={() => {
                      setLoc(DEMO_LOCATION)
                      setLocError('')
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                    title="Use demo location"
                  >
                    <MapPin className="size-3.5" />
                    Demo
                  </button>
                )}
                {loc && (
                  <button
                    onClick={() => setLoc(null)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-rose-600"
                    title="Clear location"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. closest restaurant with pizza"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        )}

        {/* Launcher */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl transition hover:scale-105 hover:shadow-2xl"
          aria-label="Open kitchen assistant"
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        </button>
      </div>
    </>
  )
}

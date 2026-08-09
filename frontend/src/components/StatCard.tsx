import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  sub,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'
  sub?: string
}) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

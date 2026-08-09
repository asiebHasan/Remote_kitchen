import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui'

export default function PaymentResult({
  tone = 'success',
  title,
  message,
}: {
  tone?: 'success' | 'canceled'
  title: string
  message: string
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-full ${
          tone === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <div className="mt-8 flex gap-3">
        <Link to="/orders">
          <Button>View orders</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

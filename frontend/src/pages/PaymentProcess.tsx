import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CreditCard } from 'lucide-react'
import { api } from '../lib/api'
import { Button, Card, Spinner } from '../components/ui'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load payment SDK'))
    document.head.appendChild(script)
  })
}

export default function PaymentProcess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const dropinRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)

  const setupDropIn = useCallback(async () => {
    if (!orderId) {
      setError('No order selected for payment.')
      setLoading(false)
      return
    }
    try {
      const orderData = await api(`/api/orders/${orderId}/`)
      setOrder(orderData)
      if (orderData.payment_status) {
        setError('This order has already been paid.')
        setLoading(false)
        return
      }
      const { client_token } = await api('/api/payment/token/')
      await loadScript(
        'https://js.braintreegateway.com/web/dropin/1.38.1/js/dropin.min.js',
      )
      const braintree: any = (window as any).braintree
      braintree.dropin.create(
        {
          authorization: client_token,
          container: containerRef.current,
          locale: 'en_US',
        },
        (err: unknown, instance: any) => {
          if (err) {
            setError('Unable to initialize payment form.')
          } else {
            dropinRef.current = instance
          }
          setLoading(false)
        },
      )
    } catch (err) {
      setError((err as Error).message || 'Unable to load payment.')
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    setupDropIn()
    return () => {
      dropinRef.current?.teardown?.()
    }
  }, [setupDropIn])

  async function handlePay() {
    if (!dropinRef.current) return
    setProcessing(true)
    setError('')
    dropinRef.current.requestPaymentMethod(async (err: unknown, payload: any) => {
      if (err) {
        setError('Please complete the payment fields.')
        setProcessing(false)
        return
      }
      try {
        await api('/api/payment/process/', {
          method: 'POST',
          body: JSON.stringify({
            order_id: Number(orderId),
            payment_method_nonce: payload.nonce,
          }),
        })
        navigate('/payment/done')
      } catch (payErr) {
        setError((payErr as Error).message || 'Payment failed.')
        setProcessing(false)
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" /> Orders
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pay by credit card</h1>
        <p className="mt-1 text-sm text-slate-500">
          {order
            ? `Secure payment for order #${order.id} — ${order.restaurant_name}.`
            : 'Secure checkout.'}
        </p>
      </div>

      <Card className="p-6">
        {loading && !order && !error ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="size-8" />
          </div>
        ) : error && !order ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              {error}
            </div>
            <Link to="/my-orders">
              <Button variant="secondary">Back to orders</Button>
            </Link>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            {error}
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
                <Spinner className="size-8" />
              </div>
            )}
            <div ref={containerRef} />
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={handlePay}
              loading={processing}
              disabled={loading}
            >
              {!processing && !loading && <CreditCard className="size-4" />} Pay now
            </Button>
            <p className="mt-4 text-center text-xs text-slate-400">
              Payments are processed in a sandbox environment for this demo.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

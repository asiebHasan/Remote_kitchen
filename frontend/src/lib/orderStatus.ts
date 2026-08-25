export type OrderStatusTone = 'success' | 'pending' | 'danger' | 'info' | 'neutral'

export const ORDER_STATUSES: Record<
  string,
  { label: string; tone: OrderStatusTone }
> = {
  pending: { label: 'Pending', tone: 'pending' },
  preparing: { label: 'Preparing', tone: 'info' },
  ready: { label: 'Ready', tone: 'success' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUSES)

export function orderStatusInfo(status?: string | null) {
  return ORDER_STATUSES[status ?? ''] ?? { label: status ?? 'Unknown', tone: 'neutral' as const }
}

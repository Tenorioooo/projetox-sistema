export interface ApiError extends Error {
  statusCode: number
  errors?: Record<string, string[]>
}

export interface JwtPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'OPERATOR'
  iat?: number
  exp?: number
}

export interface CheckinRequest {
  token: string
  deviceInfo?: string
}

export interface CheckinResult {
  success: boolean
  message: string
  ticket?: {
    id: string
    code: string
    status: string
    buyerName: string
    eventTitle: string
    ticketTypeName: string
    checkedInAt?: string
  }
}

export interface PaymentWebhookPayload {
  provider: string
  externalId: string
  status: 'approved' | 'pending' | 'failed' | 'refunded'
  amount: number
  metadata?: Record<string, unknown>
}

export interface CreateOrderInput {
  eventId: string
  ticketTypeId: string
  quantity: number
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  paymentMethod: 'pix' | 'credit_card'
}

export interface DashboardMetrics {
  salesToday: number
  ticketsSoldTotal: number
  checkinsToday: number
  revenueTotal: number
  revenueToday: number
  pendingOrders: number
}

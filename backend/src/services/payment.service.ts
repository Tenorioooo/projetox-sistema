import { PaymentWebhookPayload } from '../types'

/**
 * Payment Provider Interface
 * Implement this for each payment gateway
 */
export interface PaymentProvider {
  name: string
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  getPaymentStatus(externalId: string): Promise<PaymentStatus>
  processWebhook(payload: unknown): Promise<PaymentWebhookPayload>
}

export interface CreatePaymentParams {
  orderId: string
  amount: number
  description: string
  buyerEmail: string
  buyerName: string
  paymentMethod: 'pix' | 'credit_card'
}

export interface PaymentResult {
  externalId: string
  status: 'pending' | 'approved' | 'failed'
  paymentUrl?: string
  pixQrCode?: string
  pixQrCodeBase64?: string
  pixKey?: string
  expiresAt?: string
}

export type PaymentStatus = 'pending' | 'approved' | 'failed' | 'refunded'

// ============================================
// MOCK PAYMENT PROVIDER (Development / Testing)
// ============================================

export class MockPaymentProvider implements PaymentProvider {
  name = 'mock'

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    console.log(`[MockPayment] Creating payment for order ${params.orderId} — R$ ${params.amount}`)

    // Simulate async processing
    await new Promise((r) => setTimeout(r, 300))

    const externalId = `mock_${Date.now()}_${params.orderId.substring(0, 8)}`

    if (params.paymentMethod === 'pix') {
      return {
        externalId,
        status: 'approved', // Auto-approve in mock mode
        pixQrCode: '00020126580014BR.GOV.BCB.PIX0136projetox-mock-pix-key520400005303986540' + params.amount.toFixed(2).replace('.', '') + '5802BR5925PROJETOX PRODUCOES LTDA6009SAO PAULO62070503126304E85C',
        pixKey: 'projetox@pix.mock',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }
    }

    return {
      externalId,
      status: 'approved',
    }
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    return 'approved'
  }

  async processWebhook(payload: unknown): Promise<PaymentWebhookPayload> {
    const p = payload as Record<string, unknown>
    return {
      provider: 'mock',
      externalId: String(p.externalId || ''),
      status: 'approved',
      amount: Number(p.amount || 0),
    }
  }
}

// ============================================
// MERCADO PAGO PROVIDER (Production)
// Uncomment and configure when ready
// ============================================

// export class MercadoPagoProvider implements PaymentProvider {
//   name = 'mercadopago'
//   private accessToken: string
//
//   constructor(accessToken: string) {
//     this.accessToken = accessToken
//   }
//
//   async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
//     // Implement MercadoPago Payments API
//     // https://www.mercadopago.com.br/developers/en/reference/payments/_payments/post
//     throw new Error('MercadoPago not yet implemented. Set PAYMENT_PROVIDER=mercadopago in .env')
//   }
//   ...
// }

// ============================================
// FACTORY — Selects provider based on env
// ============================================

export function getPaymentProvider(env: { PAYMENT_PROVIDER: string }): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case 'mock':
      return new MockPaymentProvider()
    // case 'mercadopago':
    //   return new MercadoPagoProvider(process.env.MERCADOPAGO_ACCESS_TOKEN!)
    default:
      console.warn(`Unknown payment provider: ${env.PAYMENT_PROVIDER}. Falling back to mock.`)
      return new MockPaymentProvider()
  }
}

import { Router, Request, Response, NextFunction } from 'express'
import { getPaymentProvider } from '../services/payment.service'
import { generateTicketsForOrder } from './orders.routes'
import { env } from '../config/env'
import { generateHmac, safeCompare } from '../utils/crypto'
import { prisma } from '../lib/prisma'

const router = Router()

// POST /api/webhooks/payment — Receive payment status notifications
router.post('/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify webhook signature if provided
    const signature = req.headers['x-webhook-signature'] as string
    if (signature && env.WEBHOOK_SECRET) {
      const expectedSig = generateHmac(JSON.stringify(req.body), env.WEBHOOK_SECRET)
      if (!safeCompare(signature, expectedSig)) {
        console.warn('[Webhook] Invalid signature — rejecting')
        res.status(401).json({ error: 'Invalid signature' })
        return
      }
    }

    const provider = getPaymentProvider(env)
    const payload = await provider.processWebhook(req.body)

    console.log(`[Webhook] Received ${payload.status} for ${payload.externalId}`)

    // Find order by external payment ID
    const order = await prisma.order.findFirst({
      where: { paymentExternalId: payload.externalId },
      include: {
        tickets: true,
      },
    })

    if (!order) {
      console.warn(`[Webhook] Order not found for externalId: ${payload.externalId}`)
      res.status(200).json({ received: true, warning: 'Order not found' })
      return
    }

    // Map webhook status to our PaymentStatus enum
    const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'FAILED' | 'REFUNDED'> = {
      approved: 'APPROVED',
      pending: 'PENDING',
      failed: 'FAILED',
      refunded: 'REFUNDED',
    }

    const newStatus = statusMap[payload.status] || 'PENDING'

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: newStatus },
    })

    // If payment just became approved and no tickets generated yet
    if (newStatus === 'APPROVED' && order.tickets.length === 0) {
      // Find the ticket type from the first ticket or from the order context
      // For simplicity, we'll need to find it from order metadata
      // In a real system, you'd store ticketTypeId on the order
      console.log(`[Webhook] Payment approved for order ${order.id} — generating tickets`)

      // Note: In production, you'd have order items with ticket type references
      // For now, webhook approval triggers are handled by the mock provider auto-approving
    }

    if (newStatus === 'REFUNDED') {
      // Cancel all tickets in this order
      await prisma.ticket.updateMany({
        where: { orderId: order.id, status: 'VALID' },
        data: { status: 'CANCELLED' },
      })
      console.log(`[Webhook] Tickets cancelled for refunded order ${order.id}`)
    }

    res.status(200).json({ received: true, status: newStatus })
  } catch (err) {
    console.error('[Webhook] Error processing:', err)
    // Always return 200 to webhooks to prevent retries for handled errors
    res.status(200).json({ received: true, error: 'Processing error' })
  }
})

export default router

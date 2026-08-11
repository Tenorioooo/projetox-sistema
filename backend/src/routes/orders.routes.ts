import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'
import { generateSecureToken, generateTicketCode } from '../utils/crypto'
import { generateTicketQRCode, generateTicketQRCodeBase64 } from '../services/qrcode.service'
import { sendTicketEmail } from '../services/email.service'
import { getPaymentProvider } from '../services/payment.service'
import { env } from '../config/env'

const router = Router()

const createOrderSchema = z.object({
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  buyerName: z.string().min(3),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(8),
  buyerCpf: z.string().min(11).optional(),
  paymentMethod: z.enum(['pix', 'credit_card']),
})

// GET /api/orders/my-tickets — Search tickets by CPF or Email
router.get('/my-tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cpf } = req.query
    if (!cpf || typeof cpf !== 'string') {
      res.status(400).json({ error: 'Informe um CPF válido para buscar seus ingressos' })
      return
    }

    const cleanCpf = cpf.replace(/\D/g, '')

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerCpf: { contains: cleanCpf } },
          { buyerCpf: { contains: cpf } },
          { buyerEmail: { equals: cpf.trim().toLowerCase() } }
        ],
        paymentStatus: 'APPROVED'
      },
      include: {
        tickets: {
          include: {
            ticketType: {
              include: {
                event: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Flatten all tickets
    const tickets = orders.flatMap(o => o.tickets)

    res.json({ cpf, total: tickets.length, tickets })
  } catch (err) {
    next(err)
  }
})

// POST /api/orders — Public: create order and initiate payment
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createOrderSchema.parse(req.body)

    // Clean CPF if provided
    const cleanCpf = data.buyerCpf ? data.buyerCpf.replace(/\D/g, '') : null

    // Fetch ticket type and event
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: data.ticketTypeId },
      include: { event: true },
    })

    if (!ticketType || !ticketType.active) {
      res.status(404).json({ error: 'Tipo de ingresso não encontrado' })
      return
    }

    if (ticketType.event.status !== 'PUBLISHED') {
      res.status(400).json({ error: 'Evento não está disponível para venda' })
      return
    }

    const available = ticketType.quantity - ticketType.sold
    if (available < data.quantity) {
      res.status(400).json({
        error: `Ingressos insuficientes. Disponível: ${available}`,
      })
      return
    }

    const total = ticketType.price * data.quantity
    const paymentProvider = getPaymentProvider(env)

    // Create order in pending state
    const order = await prisma.order.create({
      data: {
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerCpf: cleanCpf || data.buyerCpf,
        total,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'PENDING',
      },
    })

    // Create payment intent
    const paymentResult = await paymentProvider.createPayment({
      orderId: order.id,
      amount: total,
      description: `${data.quantity}x ${ticketType.name} — ${ticketType.event.title}`,
      buyerEmail: data.buyerEmail,
      buyerName: data.buyerName,
      paymentMethod: data.paymentMethod,
    })

    // Update order with payment data
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentExternalId: paymentResult.externalId,
        paymentStatus: paymentResult.status === 'approved' ? 'APPROVED' : 'PENDING',
      },
    })

    // If mock/instant approval, generate tickets immediately
    if (paymentResult.status === 'approved') {
      await generateTicketsForOrder(order.id, ticketType.id, ticketType.event.id, data.quantity, {
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        eventTitle: ticketType.event.title,
        eventDate: ticketType.event.startDate.toLocaleString('pt-BR'),
        eventLocation: ticketType.event.location,
        eventCity: ticketType.event.city,
        ticketTypeName: ticketType.name,
      })
    }

    res.status(201).json({
      orderId: order.id,
      status: paymentResult.status,
      total,
      payment: {
        externalId: paymentResult.externalId,
        pixQrCode: paymentResult.pixQrCode,
        pixKey: paymentResult.pixKey,
        expiresAt: paymentResult.expiresAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/orders/:id — Public: get order with tickets
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: {
          include: {
            ticketType: { include: { event: true } },
          },
        },
      },
    })

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' })
      return
    }

    res.json(order)
  } catch (err) {
    next(err)
  }
})

// GET /api/orders — Admin: list all orders
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '50', offset = '0', status } = req.query

    const where = status ? { paymentStatus: String(status) as 'PENDING' | 'APPROVED' | 'FAILED' | 'REFUNDED' } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          tickets: {
            select: { id: true, code: true, status: true, ticketType: { select: { name: true } } },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    res.json({ orders, total })
  } catch (err) {
    next(err)
  }
})

// Helper: generate tickets after payment approval
export async function generateTicketsForOrder(
  orderId: string,
  ticketTypeId: string,
  eventId: string,
  quantity: number,
  emailData: {
    buyerName: string
    buyerEmail: string
    eventTitle: string
    eventDate: string
    eventLocation: string
    eventCity: string
    ticketTypeName: string
  }
) {
  const tickets = []

  for (let i = 0; i < quantity; i++) {
    const qrToken = generateSecureToken(32)
    const code = generateTicketCode()

    // Generate QR Code image
    const qrCodeUrl = await generateTicketQRCode(qrToken, code)
    const qrCodeBase64 = await generateTicketQRCodeBase64(qrToken)

    const ticket = await prisma.ticket.create({
      data: {
        orderId,
        ticketTypeId,
        code,
        qrToken,
        qrCodeUrl,
        status: 'VALID',
      },
    })

    tickets.push(ticket)

    // Send email with QR code
    await sendTicketEmail({
      buyerName: emailData.buyerName,
      buyerEmail: emailData.buyerEmail,
      eventTitle: emailData.eventTitle,
      eventDate: emailData.eventDate,
      eventLocation: emailData.eventLocation,
      eventCity: emailData.eventCity,
      ticketTypeName: emailData.ticketTypeName,
      ticketCode: code,
      qrCodeBase64,
      orderId,
    }).catch(console.error) // Don't fail order if email fails

    // Update ticket emailSentAt
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { emailSentAt: new Date() },
    })
  }

  // Update sold count on ticket type
  await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: { sold: { increment: quantity } },
  })

  console.log(`✅ Generated ${tickets.length} tickets for order ${orderId}`)
  return tickets
}

export default router

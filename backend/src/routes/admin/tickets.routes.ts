import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'

const router = Router()

// GET /api/admin/tickets — Search and list tickets
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, email, status, limit = '50', offset = '0' } = req.query

    const where: Record<string, unknown> = {}
    if (code) where.code = { contains: String(code).toUpperCase() }
    if (status) where.status = status

    const tickets = await prisma.ticket.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { buyerName: true, buyerEmail: true, buyerPhone: true } },
        ticketType: { include: { event: { select: { title: true, startDate: true } } } },
      },
    })

    // Filter by buyer email if provided
    const filtered = email
      ? tickets.filter((t) => t.order.buyerEmail.toLowerCase().includes(String(email).toLowerCase()))
      : tickets

    res.json({ tickets: filtered, total: filtered.length })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/tickets/:id/cancel — Cancel a ticket
router.put('/:id/cancel', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } })

    if (!ticket) {
      res.status(404).json({ error: 'Ingresso não encontrado' })
      return
    }

    if (ticket.status === 'USED') {
      res.status(400).json({ error: 'Não é possível cancelar ingresso já utilizado' })
      return
    }

    await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })

    res.json({ message: 'Ingresso cancelado com sucesso' })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/tickets/:id/resend-email — Resend ticket email
router.post('/:id/resend-email', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        order: true,
        ticketType: { include: { event: true } },
      },
    })

    if (!ticket) {
      res.status(404).json({ error: 'Ingresso não encontrado' })
      return
    }

    const { generateTicketQRCodeBase64 } = await import('../../services/qrcode.service')
    const { sendTicketEmail } = await import('../../services/email.service')

    const qrCodeBase64 = await generateTicketQRCodeBase64(ticket.qrToken)

    await sendTicketEmail({
      buyerName: ticket.order.buyerName,
      buyerEmail: ticket.order.buyerEmail,
      eventTitle: ticket.ticketType.event.title,
      eventDate: ticket.ticketType.event.startDate.toLocaleString('pt-BR'),
      eventLocation: ticket.ticketType.event.location,
      eventCity: ticket.ticketType.event.city,
      ticketTypeName: ticket.ticketType.name,
      ticketCode: ticket.code,
      qrCodeBase64,
      orderId: ticket.orderId,
    })

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { emailSentAt: new Date() },
    })

    res.json({ message: 'E-mail reenviado com sucesso' })
  } catch (err) {
    next(err)
  }
})

export default router

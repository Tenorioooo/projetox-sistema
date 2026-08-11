import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'

const router = Router()

// GET /api/admin/reports/sales — Revenue and sales by event
router.get('/sales', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, from, to } = req.query

    const dateFilter = {
      ...(from && { gte: new Date(String(from)) }),
      ...(to && { lte: new Date(String(to)) }),
    }

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'APPROVED',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        tickets: {
          include: {
            ticketType: {
              include: { event: { select: { id: true, title: true, startDate: true } } },
            },
          },
        },
      },
    })

    // Group by event
    const byEvent: Record<string, { eventTitle: string; revenue: number; tickets: number }> = {}
    orders.forEach((order) => {
      order.tickets.forEach((ticket) => {
        const eid = ticket.ticketType.event.id
        if (!byEvent[eid]) {
          byEvent[eid] = { eventTitle: ticket.ticketType.event.title, revenue: 0, tickets: 0 }
        }
        byEvent[eid].revenue += ticket.ticketType.price
        byEvent[eid].tickets += 1
      })
    })

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      byEvent: Object.values(byEvent),
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/reports/checkins — Check-in attendance report
router.get('/checkins', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkins = await prisma.checkinLog.findMany({
      where: { success: true },
      orderBy: { checkedAt: 'desc' },
      take: 500,
      include: {
        ticket: {
          include: {
            order: { select: { buyerName: true, buyerEmail: true } },
            ticketType: { include: { event: { select: { title: true } } } },
          },
        },
        operator: { select: { name: true } },
      },
    })

    res.json(checkins)
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/reports/export-csv — Export tickets as CSV
router.get('/export-csv', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        order: true,
        ticketType: { include: { event: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const csv = [
      'Código,Status,Comprador,Email,Telefone,Evento,Tipo,Preço,Check-In,Criado em',
      ...tickets.map((t) =>
        [
          t.code,
          t.status,
          `"${t.order.buyerName}"`,
          t.order.buyerEmail,
          t.order.buyerPhone,
          `"${t.ticketType.event.title}"`,
          `"${t.ticketType.name}"`,
          t.ticketType.price.toFixed(2),
          t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('pt-BR') : '',
          new Date(t.createdAt).toLocaleString('pt-BR'),
        ].join(',')
      ),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="ingressos-projetox.csv"')
    res.send('\uFEFF' + csv) // BOM for Excel UTF-8
  } catch (err) {
    next(err)
  }
})

export default router

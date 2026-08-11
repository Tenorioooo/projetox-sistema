import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'

const router = Router()

// GET /api/admin/dashboard — Dashboard KPI metrics with event and date filters
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, period = 'all', startDate: customStart, endDate: customEnd } = req.query

    // Calculate Date Boundaries
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined = now

    if (period === 'today') {
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
    } else if (period === '7days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'custom' && customStart) {
      startDate = new Date(String(customStart))
      if (customEnd) {
        endDate = new Date(String(customEnd))
      }
    }

    // Build Prisma Where Clauses
    const dateFilter = startDate ? { gte: startDate, lte: endDate } : undefined

    const orderWhere: Record<string, any> = {}
    if (dateFilter) orderWhere.createdAt = dateFilter
    if (eventId && String(eventId) !== 'all') {
      orderWhere.tickets = {
        some: {
          ticketType: {
            eventId: String(eventId),
          },
        },
      }
    }

    const ticketWhere: Record<string, any> = {
      status: { in: ['VALID', 'USED'] },
    }
    if (dateFilter) ticketWhere.createdAt = dateFilter
    if (eventId && String(eventId) !== 'all') {
      ticketWhere.ticketType = { eventId: String(eventId) }
    }

    const checkinWhere: Record<string, any> = { success: true }
    if (dateFilter) checkinWhere.checkedAt = dateFilter
    if (eventId && String(eventId) !== 'all') {
      checkinWhere.ticket = { ticketType: { eventId: String(eventId) } }
    }

    // Run parallel queries
    const [
      revenueResult,
      ticketsSoldTotal,
      checkinsTotal,
      pendingOrdersCount,
      approvedOrdersCount,
      recentOrders,
      checkinLogs,
    ] = await Promise.all([
      // Total Revenue
      prisma.order.aggregate({
        where: { ...orderWhere, paymentStatus: 'APPROVED' },
        _sum: { total: true },
      }),
      // Tickets Sold Total
      prisma.ticket.count({ where: ticketWhere }),
      // Check-ins Total
      prisma.checkinLog.count({ where: checkinWhere }),
      // Pending Orders Count
      prisma.order.count({
        where: { ...orderWhere, paymentStatus: 'PENDING' },
      }),
      // Approved Orders Count
      prisma.order.count({
        where: { ...orderWhere, paymentStatus: 'APPROVED' },
      }),
      // Recent Orders (filtered)
      prisma.order.findMany({
        where: orderWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          buyerName: true,
          buyerEmail: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          tickets: {
            select: {
              ticketType: {
                select: { name: true, event: { select: { title: true } } },
              },
            },
            take: 1,
          },
        },
      }),
      // Check-ins for Chart
      prisma.checkinLog.findMany({
        where: checkinWhere,
        select: { checkedAt: true },
        orderBy: { checkedAt: 'asc' },
      }),
    ])

    // Process Check-in Chart Data (by hour if single day, or by date if multi-day)
    const isSingleDay = period === 'today' || (startDate && endDate && (endDate.getTime() - startDate.getTime() <= 24 * 60 * 60 * 1000))

    let checkinChart: Array<{ hour: string; count: number }> = []

    if (isSingleDay) {
      const hourMap: Record<number, number> = {}
      checkinLogs.forEach((log) => {
        const h = new Date(log.checkedAt).getHours()
        hourMap[h] = (hourMap[h] || 0) + 1
      })

      checkinChart = Array.from({ length: 24 }, (_, h) => ({
        hour: `${h}:00`,
        count: hourMap[h] || 0,
      }))
    } else {
      const dateMap: Record<string, number> = {}
      checkinLogs.forEach((log) => {
        const dateStr = new Date(log.checkedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        dateMap[dateStr] = (dateMap[dateStr] || 0) + 1
      })

      checkinChart = Object.keys(dateMap).map((d) => ({
        hour: d,
        count: dateMap[d],
      }))
    }

    res.json({
      metrics: {
        revenueTotal: revenueResult._sum.total || 0,
        ticketsSoldTotal,
        checkinsTotal,
        pendingOrders: pendingOrdersCount,
        approvedOrders: approvedOrdersCount,
      },
      recentOrders,
      checkinChart,
      filtersApplied: {
        eventId: eventId || 'all',
        period,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router

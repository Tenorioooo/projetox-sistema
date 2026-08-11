import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate, requireOperatorOrAdmin } from '../middleware/auth.middleware'
import { processCheckin } from '../services/checkin.service'
import { prisma } from '../lib/prisma'

const router = Router()

const checkinSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  deviceInfo: z.string().optional(),
})

// POST /api/checkin — Validate QR token (requires operator or admin auth)
router.post('/', authenticate, requireOperatorOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, deviceInfo } = checkinSchema.parse(req.body)
    const ipAddress = req.ip || req.socket.remoteAddress

    const result = await processCheckin(
      token,
      req.user?.userId,
      deviceInfo,
      ipAddress
    )

    const statusCode = result.success ? 200 : 400
    res.status(statusCode).json(result)
  } catch (err) {
    next(err)
  }
})

// GET /api/checkin/recent — Get recent checkins for display at portaria
router.get('/recent', authenticate, requireOperatorOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 20

    const logs = await prisma.checkinLog.findMany({
      take: limit,
      orderBy: { checkedAt: 'desc' },
      include: {
        ticket: {
          include: {
            order: { select: { buyerName: true } },
            ticketType: {
              include: { event: { select: { title: true } } }
            },
          },
        },
        operator: { select: { name: true } },
      },
    })

    res.json(logs)
  } catch (err) {
    next(err)
  }
})

// GET /api/checkin/stats — Real-time stats for admin dashboard portaria
router.get('/stats', authenticate, requireOperatorOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalToday, successToday, failedToday, totalAll] = await Promise.all([
      prisma.checkinLog.count({ where: { checkedAt: { gte: today } } }),
      prisma.checkinLog.count({ where: { checkedAt: { gte: today }, success: true } }),
      prisma.checkinLog.count({ where: { checkedAt: { gte: today }, success: false } }),
      prisma.ticket.count({ where: { status: 'USED' } }),
    ])

    res.json({ totalToday, successToday, failedToday, totalAll })
  } catch (err) {
    next(err)
  }
})

export default router

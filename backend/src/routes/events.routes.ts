import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

const eventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().min(10),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().min(3),
  address: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'FINISHED']).optional(),
  capacity: z.number().int().positive().optional(),
  ageRating: z.number().int().min(0).max(21).optional(),
})

// GET /api/events — Public: list published events
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, status = 'PUBLISHED', limit = '20', offset = '0' } = req.query

    const where: Record<string, unknown> = { status }
    if (city) where.city = { contains: String(city), mode: 'insensitive' }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { startDate: 'asc' },
        include: {
          ticketTypes: {
            where: { active: true },
            select: { id: true, name: true, price: true, quantity: true, sold: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ])

    res.json({ events, total, limit: Number(limit), offset: Number(offset) })
  } catch (err) {
    next(err)
  }
})

// GET /api/events/admin/all — Admin: all events
router.get('/admin/all', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: { ticketTypes: true },
    })
    res.json(events)
  } catch (err) {
    next(err)
  }
})

// GET /api/events/:slug — Public: single event by slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slugParam = req.params.slug as string
    const event = await prisma.event.findUnique({
      where: { slug: slugParam },
      include: {
        ticketTypes: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
      },
    })

    if (!event) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    res.json(event)
  } catch (err) {
    next(err)
  }
})

// POST /api/events — Admin: create event
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = eventSchema.parse(req.body)

    const event = await prisma.event.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    })

    res.status(201).json(event)
  } catch (err) {
    next(err)
  }
})

// PUT /api/events/:id — Admin: update event and ticket types
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketTypes, ...eventData } = req.body
    const data = eventSchema.partial().parse(eventData)

    const eventId = req.params.id as string

    // Update main event fields
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
    })

    // Upsert / update ticket types if provided
    if (Array.isArray(ticketTypes)) {
      for (const tt of ticketTypes) {
        if (tt.id) {
          await prisma.ticketType.update({
            where: { id: tt.id },
            data: {
              name: tt.name,
              price: Number(tt.price),
              quantity: Number(tt.quantity),
              active: tt.active !== undefined ? tt.active : true,
            },
          })
        } else if (tt.name && tt.price) {
          await prisma.ticketType.create({
            data: {
              eventId,
              name: tt.name,
              price: Number(tt.price),
              quantity: Number(tt.quantity || 1000),
            },
          })
        }
      }
    }

    const fullEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    })

    res.json(fullEvent)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/events/:id — Admin: delete event cleanly
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.params.id as string

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: { include: { tickets: true } } },
    })

    if (!event) {
      res.status(404).json({ error: 'Evento não encontrado' })
      return
    }

    // Delete associated checkin logs, tickets, ticket types, and event in transaction
    await prisma.$transaction(async (tx) => {
      const ticketTypeIds = (event as any).ticketTypes.map((tt: { id: string }) => tt.id)

      if (ticketTypeIds.length > 0) {
        // Find tickets
        const tickets = await tx.ticket.findMany({
          where: { ticketTypeId: { in: ticketTypeIds } },
          select: { id: true, orderId: true },
        })
        const ticketIds = tickets.map((t) => t.id)
        const orderIds = Array.from(new Set(tickets.map((t) => t.orderId)))

        if (ticketIds.length > 0) {
          // Delete checkin logs
          await tx.checkinLog.deleteMany({
            where: { ticketId: { in: ticketIds } },
          })

          // Delete tickets
          await tx.ticket.deleteMany({
            where: { id: { in: ticketIds } },
          })
        }

        if (orderIds.length > 0) {
          // Delete orders that no longer have tickets
          await tx.order.deleteMany({
            where: { id: { in: orderIds } },
          })
        }

        // Delete ticket types
        await tx.ticketType.deleteMany({
          where: { id: { in: ticketTypeIds } },
        })
      }

      // Delete the event
      await tx.event.delete({
        where: { id: eventId },
      })
    })

    res.json({ message: 'Evento excluído com sucesso' })
  } catch (err) {
    next(err)
  }
})

export default router


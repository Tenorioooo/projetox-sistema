import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate, requireAdmin } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

const ticketTypeSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(2),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  active: z.boolean().optional(),
})

// GET /api/ticket-types?eventId=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.query
    const where = eventId ? { eventId: String(eventId), active: true } : { active: true }

    const types = await prisma.ticketType.findMany({
      where,
      include: { event: { select: { title: true, slug: true } } },
      orderBy: { price: 'asc' },
    })

    res.json(types)
  } catch (err) {
    next(err)
  }
})

// POST /api/ticket-types
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ticketTypeSchema.parse(req.body)
    const type = await prisma.ticketType.create({ data })
    res.status(201).json(type)
  } catch (err) {
    next(err)
  }
})

// PUT /api/ticket-types/:id
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ticketTypeSchema.partial().parse(req.body)
    const type = await prisma.ticketType.update({ where: { id: req.params.id }, data })
    res.json(type)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/ticket-types/:id
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = await prisma.ticketType.findUnique({ where: { id: req.params.id } })
    if (!type) { res.status(404).json({ error: 'Não encontrado' }); return }
    if (type.sold > 0) { res.status(400).json({ error: 'Não é possível excluir lote com vendas' }); return }
    await prisma.ticketType.delete({ where: { id: req.params.id } })
    res.json({ message: 'Tipo de ingresso excluído' })
  } catch (err) {
    next(err)
  }
})

export default router

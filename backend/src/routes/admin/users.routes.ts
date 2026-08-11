import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'

const router = Router()

const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'OPERATOR']).optional().default('OPERATOR'),
  active: z.boolean().optional().default(true),
})

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  active: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
})

// GET /api/admin/users — List all users
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        forcePasswordChange: true,
        createdAt: true,
      },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/users — Create new operator/admin
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body)

    const exists = await prisma.user.findUnique({ where: { email: data.email } })
    if (exists) {
      res.status(409).json({ error: 'E-mail já cadastrado no sistema' })
      return
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        active: data.active,
        forcePasswordChange: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        forcePasswordChange: true,
        createdAt: true,
      },
    })

    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/users/:id — Edit user details (email, password, role, active)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string

    // Prevent self-demotion or self-deactivation
    if (userId === req.user?.userId) {
      if (req.body.role === 'OPERATOR') {
        res.status(400).json({ error: 'Você não pode alterar seu próprio papel de Administrador' })
        return
      }
      if (req.body.active === false) {
        res.status(400).json({ error: 'Você não pode desativar sua própria conta' })
        return
      }
    }

    const data = updateUserSchema.parse(req.body)

    // Check if email belongs to another user
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
      if (existingUser && existingUser.id !== userId) {
        res.status(409).json({ error: 'Este e-mail já está sendo utilizado por outro usuário' })
        return
      }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.active !== undefined) updateData.active = data.active
    if (data.forcePasswordChange !== undefined) updateData.forcePasswordChange = data.forcePasswordChange

    // Hash password if a new password was provided
    if (data.password && data.password.trim().length >= 8) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        forcePasswordChange: true,
        createdAt: true,
      },
    })

    res.json(user)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/users/:id — Permanently delete user
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id as string

    if (userId === req.user?.userId) {
      res.status(400).json({ error: 'Você não pode excluir sua própria conta enquanto estiver logado' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    // Clean up foreign key references in checkin logs & tickets before deleting
    await prisma.$transaction(async (tx) => {
      // Nullify operatorId in CheckinLog
      await tx.checkinLog.updateMany({
        where: { operatorId: userId },
        data: { operatorId: null },
      })

      // Nullify checkedInById in Ticket
      await tx.ticket.updateMany({
        where: { checkedInById: userId },
        data: { checkedInById: null },
      })

      // Delete user
      await tx.user.delete({
        where: { id: userId },
      })
    })

    res.json({ message: `Usuário ${user.name} excluído com sucesso` })
  } catch (err) {
    next(err)
  }
})

export default router

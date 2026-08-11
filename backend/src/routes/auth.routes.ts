import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env'
import { authenticate } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.active) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, forcePasswordChange: true },
    })

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    res.json(user)
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatch) {
      res.status(400).json({ error: 'Senha atual incorreta' })
      return
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, forcePasswordChange: false },
    })

    res.json({ message: 'Senha alterada com sucesso' })
  } catch (err) {
    next(err)
  }
})

export default router

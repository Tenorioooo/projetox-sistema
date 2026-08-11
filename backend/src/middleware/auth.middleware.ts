import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { JwtPayload } from '../types'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido' })
    return
  }

  const token = authHeader.substring(7)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito a administradores' })
    return
  }

  next()
}

export function requireOperatorOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  const role = (req.user.role || '').toUpperCase()
  if (role !== 'ADMIN' && role !== 'OPERATOR') {
    res.status(403).json({ error: 'Acesso negado. Requer perfil de Administrador ou Operador de Portaria.' })
    return
  }

  next()
}

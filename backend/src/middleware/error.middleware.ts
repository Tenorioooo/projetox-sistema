import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export interface AppError extends Error {
  statusCode?: number
  errors?: Record<string, string[]>
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {}
    err.errors.forEach((e) => {
      const field = e.path.join('.')
      if (!errors[field]) errors[field] = []
      errors[field].push(e.message)
    })
    res.status(400).json({ error: 'Dados inválidos', errors })
    return
  }

  // Prisma unique constraint
  if (err.message?.includes('Unique constraint')) {
    res.status(409).json({ error: 'Registro duplicado' })
    return
  }

  // Prisma not found
  if (err.message?.includes('Record to update not found')) {
    res.status(404).json({ error: 'Registro não encontrado' })
    return
  }

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

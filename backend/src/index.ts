import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import path from 'path'
import { env } from './config/env'
import { errorMiddleware } from './middleware/error.middleware'

// Routes
import authRoutes from './routes/auth.routes'
import eventsRoutes from './routes/events.routes'
import ticketTypesRoutes from './routes/ticket-types.routes'
import ordersRoutes from './routes/orders.routes'
import checkinRoutes from './routes/checkin.routes'
import webhooksRoutes from './routes/webhooks.routes'
import dashboardRoutes from './routes/admin/dashboard.routes'
import adminTicketsRoutes from './routes/admin/tickets.routes'
import adminUsersRoutes from './routes/admin/users.routes'
import adminReportsRoutes from './routes/admin/reports.routes'

const app = express()

// GZIP compression — reduces response size by 60-80%
app.use(compression({ level: 6, threshold: 1024 }))

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const corsOriginSetting = env.CORS_ORIGIN || '*'
const allowedOrigins = corsOriginSetting.split(',').map((o) => o.trim())

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile, curl), matching origins, vercel preview/prod deployments, or if '*' configured
      if (
        !origin ||
        corsOriginSetting === '*' ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files (QR codes, banners)
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOADS_PATH)))

// HTTP Cache headers helper — for public read-only routes
const setPublicCache = (seconds: number) => (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`)
  next()
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', setPublicCache(60), eventsRoutes)    // cache 60s for public event listings
app.use('/api/ticket-types', ticketTypesRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api/webhooks', webhooksRoutes)
app.use('/api/admin/dashboard', dashboardRoutes)
app.use('/api/admin/tickets', adminTicketsRoutes)
app.use('/api/admin/users', adminUsersRoutes)
app.use('/api/admin/reports', adminReportsRoutes)

// Error handling
app.use(errorMiddleware)

// Start server
app.listen(Number(env.PORT), '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   🎵  ProjetoX Produções — Backend API        ║
  ║   🚀  Running on port ${env.PORT}                    ║
  ║   🌍  Environment: ${env.NODE_ENV}              ║
  ╚═══════════════════════════════════════════════╝
  `)
})

export default app

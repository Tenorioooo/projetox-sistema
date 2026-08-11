import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL: process.env.DATABASE_URL || '',

  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  QR_DOMAIN: process.env.QR_DOMAIN || 'http://localhost:3000',
  UPLOADS_PATH: process.env.UPLOADS_PATH || './uploads',

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'ProjetoX Produções <ingressos@projetox.com.br>',

  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  ASAAS_API_KEY: process.env.ASAAS_API_KEY || '',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'webhook-secret-change-in-production',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
} as const

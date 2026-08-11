import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token
 * @param bytes - Number of random bytes (default 32 → 64 hex chars)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Generate a short, human-readable ticket code
 * Format: PX-YEAR-XXXXXXXX
 */
export function generateTicketCode(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `PX-${year}-${random}`
}

/**
 * Hash a token with SHA-256 for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate HMAC signature for webhook verification
 */
export function generateHmac(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Compare two strings in constant time (timing-safe)
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

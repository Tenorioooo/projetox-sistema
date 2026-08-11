import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs/promises'
import { env } from '../config/env'

/**
 * Generate a QR Code PNG image for a ticket token
 * Returns the relative URL path to the generated image
 */
export async function generateTicketQRCode(qrToken: string, ticketCode: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), env.UPLOADS_PATH, 'qrcodes')

  // Ensure directory exists
  await fs.mkdir(uploadsDir, { recursive: true })

  const filename = `${ticketCode}.png`
  const filePath = path.join(uploadsDir, filename)

  // The QR code encodes the check-in URL
  const checkinUrl = `${env.QR_DOMAIN}/checkin/${qrToken}`

  await QRCode.toFile(filePath, checkinUrl, {
    type: 'png',
    width: 600,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // High error correction for reliability
  })

  return `/uploads/qrcodes/${filename}`
}

/**
 * Generate QR Code as base64 data URL (for embedding in emails)
 */
export async function generateTicketQRCodeBase64(qrToken: string): Promise<string> {
  const checkinUrl = `${env.QR_DOMAIN}/checkin/${qrToken}`

  return QRCode.toDataURL(checkinUrl, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  })
}

/**
 * Delete QR Code file when ticket is cancelled
 */
export async function deleteTicketQRCode(ticketCode: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), env.UPLOADS_PATH, 'qrcodes', `${ticketCode}.png`)
    await fs.unlink(filePath)
  } catch {
    // File might not exist, ignore
  }
}

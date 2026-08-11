import { CheckinResult } from '../types'
import { prisma } from '../lib/prisma'

/**
 * Perform atomic check-in.
 * SQLite does not support SELECT FOR UPDATE, so we use a serializable
 * transaction with a direct conditional update to prevent double entry.
 */
export async function processCheckin(
  qrToken: string,
  operatorId?: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<CheckinResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find ticket by qrToken
      const ticket = await tx.ticket.findFirst({
        where: { qrToken },
        include: {
          ticketType: {
            include: { event: true },
          },
          order: true,
        },
      })

      if (!ticket) {
        // Cannot log to checkin_logs without a valid ticketId (FK constraint).
        // Just return the failure without a log entry.
        return {
          success: false,
          message: 'QR Code inválido ou não encontrado no sistema.',
        }
      }

      // Step 2: Validate ticket status
      if (ticket.status === 'CANCELLED') {
        await tx.checkinLog.create({
          data: {
            ticketId: ticket.id,
            operatorId,
            deviceInfo,
            ipAddress,
            success: false,
            message: 'Ingresso cancelado',
          },
        })

        return {
          success: false,
          message: '❌ INGRESSO CANCELADO — Este ingresso foi cancelado e não é válido.',
          ticket: {
            id: ticket.id,
            code: ticket.code,
            status: 'CANCELLED',
            buyerName: ticket.order.buyerName,
            eventTitle: ticket.ticketType.event.title,
            ticketTypeName: ticket.ticketType.name,
          },
        }
      }

      if (ticket.status === 'USED') {
        const checkedAt = ticket.checkedInAt
          ? new Date(ticket.checkedInAt).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : 'horário desconhecido'

        await tx.checkinLog.create({
          data: {
            ticketId: ticket.id,
            operatorId,
            deviceInfo,
            ipAddress,
            success: false,
            message: `Ingresso já utilizado em ${checkedAt}`,
          },
        })

        return {
          success: false,
          message: `⚠️ INGRESSO JÁ UTILIZADO — Primeira entrada registrada em ${checkedAt}`,
          ticket: {
            id: ticket.id,
            code: ticket.code,
            status: 'USED',
            buyerName: ticket.order.buyerName,
            eventTitle: ticket.ticketType.event.title,
            ticketTypeName: ticket.ticketType.name,
            checkedInAt: ticket.checkedInAt?.toISOString(),
          },
        }
      }

      // Step 3: Mark ticket as USED atomically (only if still VALID)
      const now = new Date()

      const updated = await tx.ticket.updateMany({
        where: { id: ticket.id, status: 'VALID' }, // Guard: prevents double check-in
        data: {
          status: 'USED',
          checkedInAt: now,
          checkedInById: operatorId,
        },
      })

      // If 0 rows updated, another process beat us to it (race condition guard)
      if (updated.count === 0) {
        return {
          success: false,
          message: '⚠️ INGRESSO JÁ UTILIZADO — Entrada já registrada por outro operador.',
          ticket: {
            id: ticket.id,
            code: ticket.code,
            status: 'USED',
            buyerName: ticket.order.buyerName,
            eventTitle: ticket.ticketType.event.title,
            ticketTypeName: ticket.ticketType.name,
          },
        }
      }

      // Step 4: Log successful check-in
      await tx.checkinLog.create({
        data: {
          ticketId: ticket.id,
          operatorId,
          deviceInfo,
          ipAddress,
          success: true,
          message: 'Check-in realizado com sucesso',
        },
      })

      return {
        success: true,
        message: `✅ ENTRADA LIBERADA — Bem-vindo(a), ${ticket.order.buyerName}!`,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          status: 'USED',
          buyerName: ticket.order.buyerName,
          eventTitle: ticket.ticketType.event.title,
          ticketTypeName: ticket.ticketType.name,
          checkedInAt: now.toISOString(),
        },
      }
    }, {
      timeout: 10000,
      maxWait: 5000,
    })

    return result as CheckinResult
  } catch (error) {
    console.error('[CheckinService] Error:', error)
    return {
      success: false,
      message: 'Erro interno ao processar check-in. Tente novamente.',
    }
  }
}

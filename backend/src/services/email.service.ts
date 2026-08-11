import nodemailer from 'nodemailer'
import { env } from '../config/env'

interface TicketEmailData {
  buyerName: string
  buyerEmail: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventCity: string
  ticketTypeName: string
  ticketCode: string
  qrCodeBase64: string
  orderId: string
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

export function generateTicketEmailHTML(data: TicketEmailData): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Ingresso — ${data.eventTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px; }
    .body { background: #12121f; padding: 32px; }
    .ticket-card { background: #1a1a2e; border: 1px solid rgba(124,58,237,0.3); border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
    .ticket-header { background: linear-gradient(135deg, #7C3AED20, #EC489920); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .ticket-title { font-size: 22px; font-weight: 800; color: #fff; }
    .ticket-type { display: inline-block; margin-top: 8px; padding: 4px 12px; background: linear-gradient(90deg, #7C3AED, #EC4899); border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .ticket-body { padding: 24px; display: flex; gap: 24px; align-items: flex-start; }
    .ticket-info { flex: 1; }
    .info-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
    .info-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; display: block; }
    .info-value { font-size: 14px; color: #f3f4f6; font-weight: 600; display: block; margin-top: 2px; }
    .qr-section { text-align: center; flex-shrink: 0; }
    .qr-section img { width: 160px; height: 160px; border: 4px solid #fff; border-radius: 12px; display: block; }
    .qr-label { font-size: 10px; color: #6b7280; margin-top: 8px; text-transform: uppercase; font-weight: 600; }
    .code-box { background: #0a0a0f; border: 1px dashed rgba(124,58,237,0.5); border-radius: 10px; padding: 12px 24px; text-align: center; margin: 0 24px 24px; }
    .code-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
    .code-value { font-size: 20px; font-weight: 900; color: #EC4899; letter-spacing: 3px; font-family: monospace; margin-top: 4px; }
    .instructions { background: #7C3AED15; border: 1px solid #7C3AED30; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .instructions h3 { color: #a78bfa; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .instructions ol { padding-left: 20px; }
    .instructions li { font-size: 13px; color: #d1d5db; margin-bottom: 8px; line-height: 1.5; }
    .warning { background: #EF444415; border: 1px solid #EF444430; border-radius: 10px; padding: 14px 20px; text-align: center; font-size: 12px; color: #fca5a5; margin-bottom: 24px; }
    .footer { background: #0a0a0f; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer p { font-size: 12px; color: #6b7280; line-height: 1.6; }
    .footer a { color: #a78bfa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎟️ Seu Ingresso Chegou!</h1>
      <p>Pedido confirmado · ${data.orderId.substring(0, 8).toUpperCase()}</p>
    </div>

    <div class="body">
      <p style="font-size:15px; color:#d1d5db; margin-bottom:24px; line-height:1.7;">
        Olá, <strong style="color:#fff;">${data.buyerName}</strong>! Seu ingresso para o evento abaixo está confirmado. Apresente o QR Code na portaria.
      </p>

      <div class="ticket-card">
        <div class="ticket-header">
          <div class="ticket-title">${data.eventTitle}</div>
          <span class="ticket-type">${data.ticketTypeName}</span>
        </div>

        <div class="ticket-body">
          <div class="ticket-info">
            <div class="info-row">
              <div>
                <span class="info-label">📅 Data & Hora</span>
                <span class="info-value">${data.eventDate}</span>
              </div>
            </div>
            <div class="info-row">
              <div>
                <span class="info-label">📍 Local</span>
                <span class="info-value">${data.eventLocation}</span>
                <span style="font-size:12px; color:#9ca3af;">${data.eventCity}</span>
              </div>
            </div>
            <div class="info-row">
              <div>
                <span class="info-label">👤 Titular</span>
                <span class="info-value">${data.buyerName}</span>
              </div>
            </div>
          </div>

          <div class="qr-section">
            <img src="${data.qrCodeBase64}" alt="QR Code do Ingresso">
            <div class="qr-label">Escaneie na portaria</div>
          </div>
        </div>

        <div class="code-box">
          <div class="code-label">Código do Ingresso</div>
          <div class="code-value">${data.ticketCode}</div>
        </div>
      </div>

      <div class="instructions">
        <h3>📋 Instruções de uso</h3>
        <ol>
          <li>Salve este e-mail ou capture uma screenshot do QR Code.</li>
          <li>Apareça no evento com o QR Code visível na tela do celular.</li>
          <li>O código será lido pela portaria na entrada.</li>
          <li>Cada QR Code é de uso único — não compartilhe com outras pessoas.</li>
          <li>Documento de identidade com foto é <strong>obrigatório</strong>.</li>
        </ol>
      </div>

      <div class="warning">
        ⚠️ <strong>Atenção:</strong> Evento estritamente +18 anos. Menores de idade não terão acesso mesmo com ingresso válido.
      </div>
    </div>

    <div class="footer">
      <p>Dúvidas? Entre em contato via WhatsApp ou e-mail</p>
      <p style="margin-top:8px;">
        <a href="https://wa.me/5511999999999">WhatsApp</a> · 
        <a href="mailto:suporte@projetox.com.br">suporte@projetox.com.br</a>
      </p>
      <p style="margin-top:16px; font-size:11px;">© ${new Date().getFullYear()} ProjetoX Produções. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendTicketEmail(data: TicketEmailData): Promise<void> {
  // Skip if no SMTP credentials configured
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — skipping email send for ticket:', data.ticketCode)
    return
  }

  const transporter = createTransporter()

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: `${data.buyerName} <${data.buyerEmail}>`,
    subject: `🎟️ Seu ingresso para ${data.eventTitle} chegou!`,
    html: generateTicketEmailHTML(data),
  })

  console.log(`📧 Ticket email sent to ${data.buyerEmail} — code: ${data.ticketCode}`)
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  newPassword: string
): Promise<void> {
  if (!env.SMTP_USER) return

  const transporter = createTransporter()

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: `${name} <${email}>`,
    subject: 'ProjetoX Admin — Nova senha gerada',
    html: `<p>Olá ${name}, sua senha temporária é: <strong>${newPassword}</strong>. Por favor, altere no primeiro acesso.</p>`,
  })
}

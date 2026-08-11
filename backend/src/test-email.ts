import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import { sendTicketEmail, generateTicketEmailHTML } from './services/email.service'
import { generateSecureToken, generateTicketCode } from './utils/crypto'

async function runTestEmail() {
  console.log('🧪 Iniciando teste de geração e envio de e-mail de ingresso...')

  const targetEmail = process.argv[2] || 'teste@projetox.com.br'
  const buyerName = process.argv[3] || 'Nicolas Gabriel'

  const qrToken = generateSecureToken(32)
  const ticketCode = generateTicketCode()

  // Generate Base64 QR Code
  const checkinUrl = `http://localhost:3000/checkin/${qrToken}`
  const qrCodeBase64 = await QRCode.toDataURL(checkinUrl, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  })

  const emailData = {
    buyerName,
    buyerEmail: targetEmail,
    eventTitle: 'ProjetoX Neon Night — Edição São Paulo',
    eventDate: 'Sábado, 24 de Outubro de 2026 às 23:00',
    eventLocation: 'Expo Barra Funda',
    eventCity: 'São Paulo - SP',
    ticketTypeName: 'Camarote Frontstage VIP',
    ticketCode,
    qrCodeBase64,
    orderId: 'ORD-2026-987654321',
  }

  // 1. Generate HTML file for instant local preview
  const htmlContent = generateTicketEmailHTML(emailData)
  const previewPath = path.join(__dirname, '../test-email-preview.html')
  fs.writeFileSync(previewPath, htmlContent, 'utf-8')

  console.log(`\n✅ E-mail HTML de teste gerado com SUCESSO!`)
  console.log(`📁 Arquivo de visualização salvo em: ${previewPath}`)
  console.log(`🎟️ Código do Ingresso: ${ticketCode}`)
  console.log(`🔑 QR Token: ${qrToken}`)

  // 2. Try sending real email if SMTP is configured
  try {
    await sendTicketEmail(emailData)
  } catch (err: any) {
    console.log(`⚠️ Nota: SMTP não configurado no .env ou falhou (${err.message}). O arquivo HTML de preview foi gerado para você abrir no navegador.`)
  }
}

runTestEmail().catch(console.error)

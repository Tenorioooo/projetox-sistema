require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createRealTicket() {
  console.log('🎟️ Gerando ingresso REAL no banco de dados para teste de portaria...');

  // 1. Find event and ticket type
  const event = await prisma.event.findFirst({
    where: { status: 'PUBLISHED' },
    include: { ticketTypes: true },
  });

  if (!event || !event.ticketTypes.length) {
    console.error('❌ Nenhum evento com tipo de ingresso encontrado no banco.');
    return;
  }

  const ticketType = event.ticketTypes[0];

  // 2. Create Approved Order
  const order = await prisma.order.create({
    data: {
      buyerName: 'Nicolas Gabriel (Teste Real)',
      buyerEmail: 'nicolas.real@projetox.com.br',
      buyerPhone: '(11) 99999-8888',
      buyerCpf: '123.456.789-00',
      total: ticketType.price,
      paymentStatus: 'APPROVED',
      paymentMethod: 'pix',
      paymentExternalId: 'pix_real_' + Date.now(),
    },
  });

  // 3. Generate 64-char secure random qrToken
  const qrToken = crypto.randomBytes(32).toString('hex');
  const ticketCode = 'PX-2026-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  // 4. Create Ticket in DB with status VALID
  const ticket = await prisma.ticket.create({
    data: {
      orderId: order.id,
      ticketTypeId: ticketType.id,
      code: ticketCode,
      qrToken: qrToken,
      status: 'VALID',
    },
  });

  console.log(`✅ Ingresso gravado no BANCO DE DADOS:`);
  console.log(`   - ID: ${ticket.id}`);
  console.log(`   - Código: ${ticket.code}`);
  console.log(`   - Status: ${ticket.status}`);
  console.log(`   - QR Token: ${ticket.qrToken}`);

  // 5. Generate Base64 QR Code
  const checkinUrl = `http://localhost:3000/checkin/${qrToken}`;
  const qrCodeBase64 = await QRCode.toDataURL(qrToken, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  });

  // 6. Generate HTML preview page for instant browser camera scanning
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ingresso Real Válido — ${event.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #f3f4f6; padding: 20px 10px; }
    .container { max-width: 600px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 0 50px rgba(34, 197, 94, 0.4); border: 2px solid #22C55E; }
    .header { background: linear-gradient(135deg, #22C55E, #10B981); padding: 30px 24px; text-align: center; color: #000; }
    .header h1 { font-size: 26px; font-weight: 900; }
    .header p { font-size: 13px; font-weight: 700; margin-top: 4px; opacity: 0.9; }
    .body { background: #12121f; padding: 24px; }
    .ticket-card { background: #1a1a2e; border: 1px solid rgba(34,197,94,0.4); border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
    .ticket-header { background: rgba(34,197,94,0.15); padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .ticket-title { font-size: 20px; font-weight: 800; color: #fff; }
    .status-badge { padding: 4px 12px; background: #22C55E; border-radius: 20px; font-size: 11px; font-weight: 900; color: #000; uppercase; }
    .ticket-body { padding: 20px; text-align: center; }
    .qr-section img { width: 220px; height: 220px; border: 6px solid #fff; border-radius: 16px; display: block; margin: 0 auto; }
    .qr-label { font-size: 12px; color: #22C55E; margin-top: 12px; font-weight: 800; uppercase; letter-spacing: 1px; }
    .code-box { background: #0a0a0f; border: 1px dashed #22C55E; border-radius: 10px; padding: 12px; text-align: center; margin-top: 16px; }
    .code-value { font-size: 22px; font-weight: 900; color: #EC4899; letter-spacing: 3px; font-family: monospace; }
    .instructions { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 16px; font-size: 12px; color: #d1d5db; line-height: 1.6; }
    .token-box { background: #000; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #34d399; word-break: break-all; margin-top: 10px; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ INGRESSO VÁLIDO NO BANCO DE DADOS</h1>
      <p>Aponte a câmera da portaria digital para o QR Code abaixo</p>
    </div>

    <div class="body">
      <div class="ticket-card">
        <div class="ticket-header">
          <span class="ticket-title">${event.title}</span>
          <span class="status-badge">STATUS: VÁLIDO</span>
        </div>

        <div class="ticket-body">
          <div class="qr-section">
            <img src="${qrCodeBase64}" alt="QR Code Válido">
            <div class="qr-label">Aponte a Câmera da Portaria Aqui</div>
          </div>

          <div class="code-box">
            <div style="font-size:10px; color:#9ca3af; font-weight:700;">CÓDIGO DO INGRESSO</div>
            <div class="code-value">${ticketCode}</div>
          </div>
        </div>
      </div>

      <div class="instructions">
        <strong>💡 Instruções de Teste:</strong>
        <ol style="margin-left: 20px; margin-top: 8px;">
          <li>Abra a portaria digital em: <a href="http://localhost:3000/admin/checkin" target="_blank" style="color:#34d399;">http://localhost:3000/admin/checkin</a></li>
          <li>Ative a câmera e leia o QR Code acima.</li>
          <li>Na <strong>1ª leitura</strong>: Exibirá <span style="color:#22C55E; font-weight:bold;">TELA VERDE (ENTRADA LIBERADA)</span>.</li>
          <li>Na <strong>2ª leitura</strong>: Exibirá <span style="color:#EF4444; font-weight:bold;">TELA VERMELHA (INGRESSO JÁ UTILIZADO)</span>.</li>
        </ol>

        <div style="margin-top: 14px; font-weight: bold; color: #fff;">Token embutido no QR Code:</div>
        <div class="token-box">${qrToken}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const publicPath = path.join(__dirname, '../frontend/public/ingresso-real.html');
  fs.writeFileSync(publicPath, html, 'utf-8');

  console.log(`\n🎉 Página de teste de ingresso real criada em: ${publicPath}`);
}

createRealTicket()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

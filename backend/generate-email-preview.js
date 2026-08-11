const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function main() {
  const buyerName = 'Nicolas Gabriel';
  const buyerEmail = 'nicolas@projetox.com.br';
  const ticketCode = 'PX-2026-F98A';
  const orderId = 'ORD-2026-987654321';
  const eventTitle = 'ProjetoX Neon Night — Edição São Paulo';
  const eventDate = 'Sábado, 24 de Outubro de 2026 às 23:00';
  const eventLocation = 'Expo Barra Funda';
  const eventCity = 'São Paulo - SP';
  const ticketTypeName = 'Camarote Frontstage VIP';

  const checkinUrl = 'http://localhost:3000/checkin/8f9a2b4c6e1d3a5b7c9e0f2a4b6c8d0e';
  const qrCodeBase64 = await QRCode.toDataURL(checkinUrl, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Ingresso — ${eventTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0f; color: #f3f4f6; padding: 20px 10px; }
    .container { max-width: 600px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 0 40px rgba(124, 58, 237, 0.4); }
    .header { background: linear-gradient(135deg, #7C3AED, #EC4899); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px; }
    .body { background: #12121f; padding: 32px; }
    .ticket-card { background: #1a1a2e; border: 1px solid rgba(124,58,237,0.3); border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
    .ticket-header { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2)); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .ticket-title { font-size: 22px; font-weight: 800; color: #fff; }
    .ticket-type { display: inline-block; margin-top: 8px; padding: 4px 12px; background: linear-gradient(90deg, #7C3AED, #EC4899); border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .ticket-body { padding: 24px; display: flex; gap: 24px; align-items: flex-start; }
    .ticket-info { flex: 1; }
    .info-row { margin-bottom: 14px; }
    .info-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; display: block; }
    .info-value { font-size: 14px; color: #f3f4f6; font-weight: 600; display: block; margin-top: 2px; }
    .qr-section { text-align: center; flex-shrink: 0; }
    .qr-section img { width: 160px; height: 160px; border: 4px solid #fff; border-radius: 12px; display: block; }
    .qr-label { font-size: 10px; color: #9ca3af; margin-top: 8px; text-transform: uppercase; font-weight: 600; }
    .code-box { background: #0a0a0f; border: 1px dashed rgba(124,58,237,0.5); border-radius: 10px; padding: 12px 24px; text-align: center; margin: 0 24px 24px; }
    .code-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
    .code-value { font-size: 20px; font-weight: 900; color: #EC4899; letter-spacing: 3px; font-family: monospace; margin-top: 4px; }
    .instructions { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .instructions h3 { color: #a78bfa; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .instructions ol { padding-left: 20px; }
    .instructions li { font-size: 13px; color: #d1d5db; margin-bottom: 8px; line-height: 1.5; }
    .warning { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px 20px; text-align: center; font-size: 12px; color: #fca5a5; margin-bottom: 24px; }
    .footer { background: #0a0a0f; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer p { font-size: 12px; color: #6b7280; line-height: 1.6; }
    .footer a { color: #a78bfa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎟️ Seu Ingresso Chegou!</h1>
      <p>Pedido confirmado · ${orderId}</p>
    </div>

    <div class="body">
      <p style="font-size:15px; color:#d1d5db; margin-bottom:24px; line-height:1.7;">
        Olá, <strong style="color:#fff;">${buyerName}</strong>! Seu ingresso para o evento abaixo está confirmado. Apresente o QR Code na portaria.
      </p>

      <div class="ticket-card">
        <div class="ticket-header">
          <div class="ticket-title">${eventTitle}</div>
          <span class="ticket-type">${ticketTypeName}</span>
        </div>

        <div class="ticket-body">
          <div class="ticket-info">
            <div class="info-row">
              <span class="info-label">📅 Data & Hora</span>
              <span class="info-value">${eventDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📍 Local</span>
              <span class="info-value">${eventLocation}</span>
              <span style="font-size:12px; color:#9ca3af;">${eventCity}</span>
            </div>
            <div class="info-row">
              <span class="info-label">👤 Titular</span>
              <span class="info-value">${buyerName}</span>
            </div>
          </div>

          <div class="qr-section">
            <img src="${qrCodeBase64}" alt="QR Code do Ingresso">
            <div class="qr-label">Escaneie na portaria</div>
          </div>
        </div>

        <div class="code-box">
          <div class="code-label">Código Único do Ingresso</div>
          <div class="code-value">${ticketCode}</div>
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
      <p style="margin-top:16px; font-size:11px;">© 2026 ProjetoX Produções. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

  // Write to public directory of Next.js for instant browser testing
  const publicPath = path.join(__dirname, '../frontend/public/test-email.html');
  fs.writeFileSync(publicPath, html, 'utf-8');

  console.log('✅ HTML preview file created at: ' + publicPath);
}

main().catch(console.error);

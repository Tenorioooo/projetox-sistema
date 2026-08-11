# 🎵 ProjetoX Produções — Sistema de Venda de Ingressos

Sistema full-stack profissional para venda de ingressos com QR Code de uso único, painel administrativo e portaria digital.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Banco | PostgreSQL 16 |
| Infra | Docker, Docker Compose, Nginx |

## Quick Start

```bash
# 1. Clone e configure
cp .env.example .env
# Edite o .env com suas credenciais

# 2. Suba tudo com Docker
docker compose up -d

# 3. Execute o seed (primeira vez)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx ts-node prisma/seed.ts

# 4. Acesse
# Site público:  http://localhost
# Painel admin:  http://localhost/admin/login
# API health:    http://localhost/api/health
```

## Credenciais Padrão

| Usuário | Email | Senha | Papel |
|---------|-------|-------|-------|
| Admin | admin@projetox.com | Admin123! | ADMIN |
| Portaria | portaria@projetox.com | Operador123! | OPERATOR |

> ⚠️ Troque as senhas no primeiro acesso!

## Desenvolvimento Local (sem Docker)

```bash
# Terminal 1 — PostgreSQL (necessário estar rodando)
# Terminal 2 — Backend
cd backend && npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev

# Terminal 3 — Frontend
cd frontend && npm install
npm run dev
```

## API Endpoints

### Públicos
- `GET /api/events` — Listar eventos publicados
- `GET /api/events/:slug` — Detalhes do evento
- `POST /api/orders` — Criar pedido
- `GET /api/orders/:id` — Consultar pedido

### Autenticados
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Dados do usuário
- `POST /api/checkin` — Validar QR Code (OPERATOR/ADMIN)

### Admin
- `GET /api/admin/dashboard` — KPIs
- `GET /api/admin/tickets` — Buscar ingressos
- `GET /api/admin/reports/export-csv` — Exportar CSV
- CRUD completo de eventos, lotes, usuários

## Fluxo de Check-in (Uso Único)

1. Operador acessa `/admin/checkin` no celular
2. Câmera lê o QR Code do ingresso
3. Sistema executa `SELECT ... FOR UPDATE` (lock de linha)
4. Se VALID → marca como USED → tela VERDE ✅
5. Se USED → rejeita → tela VERMELHA ❌ com horário da primeira entrada
6. Se CANCELLED → rejeita → tela VERMELHA ❌

## Deploy em VPS

```bash
# No servidor Linux
git clone <repo> && cd projetox-sistema
cp .env.example .env
# Configure .env com domínio real, SMTP, JWT_SECRET seguro
docker compose up -d --build
```

Para HTTPS, configure Certbot/Let's Encrypt no Nginx.

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
RUN mkdir -p uploads/qrcodes && chown -R appuser:nodejs uploads
USER appuser
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

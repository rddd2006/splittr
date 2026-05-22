# ── Base ────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/

# ── Development ─────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]

# ── Builder ──────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
RUN npm ci --only=production
COPY . .
RUN npx prisma generate

# ── Production ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000
CMD ["node", "src/index.js"]

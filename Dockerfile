FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências do backend
COPY package*.json ./
RUN npm ci

# Instalar dependências do frontend
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Build do frontend
RUN cd client && npm run build

# Build do backend
RUN npm run build:api

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copiar package.json e instalar apenas produção
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copiar artefatos de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3003

CMD ["node", "dist/main.js"]

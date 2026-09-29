# Multi-stage Dockerfile for CampusDesk
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY shared ./shared

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source files
COPY server ./server
COPY client ./client

# Generate Prisma client and build both projects
RUN cd server && npx prisma generate && npm run build
RUN cd client && npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built artifacts and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/src/data ./server/dist/data
COPY --from=builder /app/server/src/data ./server/src/data
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/shared ./shared

EXPOSE 5000

WORKDIR /app/server
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/index.js"]

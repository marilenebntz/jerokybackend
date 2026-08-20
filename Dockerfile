# Multi-stage production Dockerfile for NestJS backend application
FROM node:22-alpine AS base

# Step 1. Install all dependencies (development & production)
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Step 2. Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Step 3. Install production dependencies only
FROM base AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Step 4. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Run as non-root user for security
USER node

# Copy built application and production dependencies
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main.js"]

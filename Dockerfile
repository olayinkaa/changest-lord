# Stage 1: Build
FROM node:22.22.3-alpine AS builder

# Enable corepack to use pnpm
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the project (prisma generate + tsc + tsc-alias)
RUN pnpm run build

# Stage 2: Production
FROM node:22.22.3-alpine AS runner

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Install pnpm for production dependency installation
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

# Copy package files and lockfile
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create a non-root user for security
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Expose the application port (default 6001 per CLAUDE.md)
EXPOSE 6001

# Default command to run the API.
# For the worker, use "node dist/worker.js" as the command in your orchestration tool.
CMD ["node", "dist/index.js"]

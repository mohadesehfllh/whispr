# Use Node.js LTS version
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend using npx
RUN npx vite build

# Build the backend ONLY with production file (avoiding any vite imports)
RUN npx esbuild server/index.prod.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outdir=dist \
  --external:express \
  --external:ws \
  --external:drizzle-orm \
  --external:@neondatabase/serverless \
  --external:memorystore \
  --external:connect-pg-simple \
  --external:passport \
  --external:passport-local \
  --external:express-session \
  --external:crypto \
  --external:path \
  --external:fs \
  --external:http \
  --external:url \
  --external:zod \
  --external:zod-validation-error \
  --external:nanoid

# Clean up any development artifacts
RUN rm -f dist/index.js

# Verify the production build exists and has no vite imports
RUN ls -la dist/ && \
    test -f dist/index.prod.js && \
    test -d dist/public && \
    ! grep -q "vite" dist/index.prod.js

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies and clean cache
RUN npm ci --frozen-lockfile --production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy shared schema for production
COPY shared ./shared

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership to non-root user
RUN chown -R appuser:nodejs /app
USER appuser

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application  
CMD ["node", "dist/index.prod.js"]
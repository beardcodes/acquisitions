# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S acquisitions -u 1001

# Copy dependencies from builder stage
COPY --from=builder --chown=acquisitions:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=acquisitions:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown acquisitions:nodejs logs

# Expose port
EXPOSE 3000

# Switch to non-root user
USER acquisitions

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["npm", "start"]
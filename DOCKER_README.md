# Acquisitions API - Docker Setup Guide

This guide explains how to run the Acquisitions API using Docker with both development (Neon Local) and production (Neon Cloud) configurations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher
- Neon account with API key (for development)
- Neon Cloud database URL (for production)

## Quick Start

### Development (with Neon Local)

1. **Clone and setup environment:**
   ```bash
   git clone <your-repo>
   cd acquisitions
   cp .env.development .env
   ```

2. **Configure Neon credentials in `.env`:**
   ```bash
   # Edit .env file with your Neon credentials
   NEON_API_KEY=your-neon-api-key
   NEON_PROJECT_ID=your-neon-project-id
   PARENT_BRANCH_ID=main
   ARCJET_KEY=your-arcjet-key
   ```

3. **Start the development stack:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application:**
   - API: http://localhost:3000
   - Database: postgres://neon:npg@localhost:5432/acquisitions

### Production

1. **Setup production environment:**
   ```bash
   cp .env.production .env
   ```

2. **Configure production variables:**
   ```bash
   export DATABASE_URL="postgres://your-username:your-password@your-endpoint.neon.tech:5432/your-database?sslmode=require"
   export JWT_TOKEN="your-strong-jwt-secret"
   export ARCJET_KEY="your-arcjet-key"
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Development Environment

### Architecture

The development setup uses **Neon Local**, a proxy service that creates ephemeral database branches for isolated development.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │────│   Neon Local    │────│   Neon Cloud    │
│   (localhost)   │    │   (Proxy)       │    │   (Remote DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Ephemeral Branches**: Each container start creates a fresh database branch
- **Automatic Cleanup**: Branches are deleted when containers stop
- **Local Connection**: App connects to `neon-local:5432` within Docker network
- **Hot Reload**: Source code changes trigger app restart

### Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Database Access

While the app runs, you can connect to the database directly:

```bash
# Connect with psql
docker exec -it acquisitions-neon-local psql -U neon -d acquisitions

# Or from host machine
psql "postgres://neon:npg@localhost:5432/acquisitions?sslmode=require"
```

## Production Environment

### Architecture

Production connects directly to **Neon Cloud** without the proxy layer.

```
┌─────────────────┐    ┌─────────────────┐
│   Your App      │────│   Neon Cloud    │
│   (Container)   │    │   (Remote DB)   │
└─────────────────┘    └─────────────────┘
```

### Key Features

- **Direct Connection**: App connects directly to Neon Cloud
- **Security Hardened**: Read-only filesystem, dropped capabilities
- **Resource Limited**: Memory and CPU constraints
- **Auto Restart**: Always restart policy
- **Health Checks**: Built-in health monitoring

### Production Commands

```bash
# Deploy production stack
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Update deployment
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate app

# Stop production stack
docker-compose -f docker-compose.prod.yml down
```

## Environment Variables

### Development (.env.development)

```bash
# Database (Neon Local)
DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions?sslmode=require

# Neon Local Configuration
NEON_API_KEY=your-neon-api-key
NEON_PROJECT_ID=your-neon-project-id
PARENT_BRANCH_ID=main

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
JWT_TOKEN=your-dev-jwt-secret
ARCJET_KEY=your-arcjet-key
```

### Production (.env.production)

```bash
# Database (Neon Cloud)
DATABASE_URL=postgres://your-username:your-password@your-endpoint.neon.tech:5432/your-database?sslmode=require

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
JWT_TOKEN=${JWT_TOKEN}
ARCJET_KEY=${ARCJET_KEY}
TZ=UTC
```

### Required Production Environment Variables

Set these as environment variables or in your deployment platform:

- `DATABASE_URL`: Your Neon Cloud connection string
- `JWT_TOKEN`: Strong JWT signing secret
- `ARCJET_KEY`: Your Arcjet API key
- `LOG_LEVEL`: Logging level (info, warn, error)

## Database Migrations

### Development

Migrations run automatically against ephemeral branches:

```bash
# Access the app container
docker exec -it acquisitions-app-dev bash

# Run migrations
npm run db:migrate

# Generate new migration
npm run db:generate

# Open Drizzle Studio
npm run db:studio
```

### Production

Run migrations before deployment:

```bash
# Run migrations in production container
docker exec -it acquisitions-app-prod npm run db:migrate

# Or run migrations locally against production DB
DATABASE_URL="your-prod-url" npm run db:migrate
```

## Troubleshooting

### Common Issues

1. **Neon Local fails to start:**
   ```bash
   # Check API credentials
   echo $NEON_API_KEY
   echo $NEON_PROJECT_ID
   
   # Check Neon Local logs
   docker-compose -f docker-compose.dev.yml logs neon-local
   ```

2. **App can't connect to database:**
   ```bash
   # Verify network connectivity
   docker exec acquisitions-app-dev ping neon-local
   
   # Check database health
   docker exec acquisitions-neon-local pg_isready -U neon
   ```

3. **Permission errors in production:**
   ```bash
   # Check container permissions
   docker exec acquisitions-app-prod whoami
   docker exec acquisitions-app-prod ls -la /app
   ```

4. **SSL connection issues:**
   ```bash
   # For JavaScript apps using Neon Local, add to your database config:
   ssl: { rejectUnauthorized: false }
   ```

### Debug Commands

```bash
# Check container status
docker ps

# View container logs
docker logs acquisitions-app-dev
docker logs acquisitions-neon-local

# Access container shell
docker exec -it acquisitions-app-dev sh

# Check network connectivity
docker network ls
docker network inspect acquisitions_acquisitions-network

# Monitor resource usage
docker stats
```

### Port Conflicts

If ports 3000 or 5432 are already in use:

```bash
# Development - modify docker-compose.dev.yml
ports:
  - "3001:3000"  # Change host port
  - "5433:5432"  # Change PostgreSQL port

# Update connection string accordingly
DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions?sslmode=require
```

## Architecture Overview

### File Structure

```
acquisitions/
├── Dockerfile                 # Multi-stage app container
├── docker-compose.dev.yml     # Development with Neon Local
├── docker-compose.prod.yml    # Production with Neon Cloud
├── .env.development           # Dev environment variables
├── .env.production            # Prod environment template
├── .dockerignore             # Docker build exclusions
└── src/                      # Application source code
```

### Container Communication

**Development:**
- App container → Neon Local container → Neon Cloud
- Port 3000: Application API
- Port 5432: PostgreSQL proxy

**Production:**
- App container → Neon Cloud (direct)
- Port 3000: Application API
- Optional: Port 80/443 via Nginx

### Security Features

**Development:**
- Isolated network
- Ephemeral data (auto-cleanup)
- Local SSL certificates

**Production:**
- Read-only root filesystem
- Dropped Linux capabilities
- Resource limits
- Non-root user execution
- Security-hardened container

### Monitoring & Health Checks

Both environments include:
- Application health checks (`/health` endpoint)
- Database connectivity checks
- Automatic restart on failure
- Structured logging

---

## Need Help?

- Check the [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- Review Docker logs: `docker-compose logs`
- Verify environment variables are set correctly
- Ensure Neon API credentials have proper permissions

Happy coding! 🚀
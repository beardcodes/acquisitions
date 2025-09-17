# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Start development server with auto-restart
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

### Database Operations

```bash
# Generate new database migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio for database GUI
npm run db:studio
```

## Code Architecture

### Project Structure

This is a Node.js Express API with TypeScript-style ES modules using import maps for path resolution. The architecture follows a layered MVC pattern:

- **Entry Point**: `src/index.js` → loads environment → starts `src/server.js`
- **Application**: `src/app.js` contains Express app setup with middleware and routes
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless driver

### Import Maps Configuration

The project uses Node.js import maps (defined in `package.json`) for clean imports:

- `#src/*` → `./src/*`
- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#middleware/*` → `./src/middleware/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

Always use these import aliases rather than relative paths when referencing code within the project.

### Layer Responsibilities

**Controllers** (`src/controllers/`)

- Handle HTTP request/response cycle
- Perform input validation using Zod schemas
- Call service layer functions
- Return JSON responses
- Handle errors and logging

**Services** (`src/services/`)

- Contain business logic
- Database operations using Drizzle ORM
- Data transformation
- Error handling with descriptive messages

**Models** (`src/models/`)

- Drizzle ORM schema definitions using `pgTable`
- Database table structure and relationships
- Currently implements: `users` table with authentication fields

**Routes** (`src/routes/`)

- Express router definitions
- HTTP method and path mappings
- Route-level middleware attachment

**Validations** (`src/validations/`)

- Zod schemas for request validation
- Input sanitization and transformation
- Currently implements: authentication schemas (`signupSchema`, `signInSchema`)

**Utils** (`src/utils/`)

- JWT token utilities (`jwt.js`)
- Cookie management utilities (`cookies.js`)
- Error formatting utilities (`format.js`)

### Database Layer

- **ORM**: Drizzle with PostgreSQL dialect
- **Driver**: Neon serverless for production
- **Migrations**: Stored in `./drizzle/` directory
- **Configuration**: `drizzle.config.js` defines schema location and credentials

### Authentication Architecture

- JWT-based authentication with HTTP-only cookies
- Password hashing using bcrypt (salt rounds: 10)
- Role-based access control (roles: 'user', 'admin')
- Cookie configuration includes security flags based on environment

### Logging

- Winston logger with JSON format
- Separate error and combined log files in `logs/` directory
- Console logging in non-production environments
- Service name: 'acquisitions-api'

## Code Standards

### ESLint Rules (Key Configurations)

- **Indentation**: 2 spaces with switch case indentation
- **Quotes**: Single quotes required
- **Semicolons**: Required
- **Line endings**: Unix (LF)
- **Unused vars**: Error (except args starting with underscore)
- **Modern JS**: Prefer const/let over var, arrow functions, object shorthand

### Prettier Configuration

- Single quotes
- Semicolons required
- 2-space indentation
- 80 character line width
- Avoid arrow function parentheses when possible
- ES5 trailing commas

## Environment Variables

Required environment variables (defined in `.env`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_TOKEN` - JWT signing secret
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment setting
- `LOG_LEVEL` - Logging level (defaults to 'info')

## Testing

The ESLint config includes Jest/testing globals but no test files exist yet. When implementing tests:

- Use Jest as the testing framework (globals already configured)
- Place tests in `tests/**/*.js` files
- Test files automatically get Jest globals (describe, it, expect, etc.)

## Current Implementation Status

### Completed Features

- User registration with validation
- JWT token generation and cookie management
- Database models and migrations for users
- Logging infrastructure
- Security middleware (helmet, CORS)
- Input validation with Zod

### Incomplete Features

- Sign-in and sign-out endpoints (stubs exist in auth.routes.js)
- Authentication middleware for protected routes
- Password comparison functionality
- Cookie management integration (imported but not used in controllers)

### Known Issues

- `auth.controller.js` line 27: References undefined `cookie` variable (should be `cookies` from utils)
- `auth.service.js` line 1: Incorrect import path (`#src/config/logger.js` should be `#config/logger.js`)

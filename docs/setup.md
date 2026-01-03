# OTOBRIX Admin - Setup and Installation Guide

## Prerequisites

**Node.js 18+** - Download from nodejs.org
**PostgreSQL database** - Use Neon (neon.tech) recommended or self-hosted
**Redis instance** - Use Upstash (upstash.com) recommended or self-hosted
**Git** - Version control system

## Quick Installation

### 1. Clone the Repository

Clone the repository using Git. Navigate to your desired directory and run the git clone command, then change into the project directory.

### 2. Install Dependencies

Run the npm install command to install all project dependencies.

### 3. Configure Environment Variables

Copy the example environment file to create your local configuration. Edit the file with your preferred text editor and add your database credentials, Redis connection details, and authentication secrets.

### 4. Set Up Database

Generate the Prisma client, run database migrations to set up your tables, and optionally seed the database with initial data using the provided seed command.

### 5. Start Development Server

Start the development server. Once running, visit <http://localhost:3000> in your browser to see the application.

## Detailed Setup Instructions

### Database Setup

**Option A: Neon (Recommended for Development)*

1. Sign up at neon.tech
2. Create a new project
3. Copy the connection string from the dashboard
4. Add to your .env.local file: DATABASE_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/dbname?sslmode=require

**Option B: Local PostgreSQL*

1. Install PostgreSQL using your system's package manager or installer
2. Create a database and user with appropriate permissions
3. Add the connection string to your .env.local file: DATABASE_URL="postgresql://otobrix_user:your_password@localhost:5432/otobrix"

### Redis Setup

**Option A: Upstash (Recommended)*

1. Sign up at upstash.com
2. Create a Redis database
3. Copy the REST URL and token
4. Add to your .env.local file:
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token

**Option B: Local Redis*

1. Install Redis using your system's package manager
2. Start the Redis service
3. Add to your .env.local file: REDIS_URL=redis://localhost:6379

### Authentication Setup

1. Generate a secure secret using a random string generator
2. Add to your .env.local file:
   NEXTAUTH_SECRET=your_generated_secret_here
   NEXTAUTH_URL=<http://localhost:3000>

3. Configure OAuth providers (optional):
   - Google OAuth: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - GitHub OAuth: Add GITHUB_ID and GITHUB_SECRET

## Environment Variables Reference

### Required Variables

DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
DIRECT_URL="postgresql://user:password@localhost:5432/dbname_shadow"
UPSTASH_REDIS_REST_URL="your_redis_rest_url"
UPSTASH_REDIS_REST_TOKEN="your_redis_token"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="<http://localhost:3000>"
NODE_ENV="development"

### Optional Variables

SENTRY_DSN="your-sentry-dsn-here"
SENTRY_ENVIRONMENT="development"
OTEL_EXPORTER_OTLP_ENDPOINT="<http://localhost:4318>"
OTEL_SERVICE_NAME="otobrix-retention"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"
ADMIN_API_KEY="your-admin-api-key"
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="<noreply@example.com>"
TEST_BASE_URL="<http://localhost:3000>"

## Testing System

### Infrastructure Tests

The project includes a comprehensive testing system. Run infrastructure tests to verify database connections, cache systems, and RFM views:

npm run test:infrastructure - Run all infrastructure tests
npm run test:env - Test environment variables
npm run test:db - Test database connection
npm run test:cache - Test cache system
npm run test:rfm - Test RFM materialized view

### Smoke Tests

Smoke tests require the development server to be running. These test API endpoints and functionality:

npm run smoke:all - Run all smoke tests
npm run smoke:health - Test health endpoints
npm run smoke:metrics - Test metrics endpoint
npm run smoke:csrf - Test CSRF protection
npm run smoke:rate-limit - Test rate limiting
npm run smoke:sentry - Test Sentry configuration

### Combined Test Suites

npm run test:all-suites - Run infrastructure and smoke tests
npm run test:full - Run unit, infrastructure, and smoke tests

### Database Operations

npm run db:refresh-rfm - Refresh RFM materialized view
npm run db:test-data - Create test data
npm run db:check-rfm - Check RFM view status

## Production Build

### Build the Application

Create a production build. The build output will be in the .next directory.

### Analyze Bundle Size

Analyze bundle size to optimize performance.

### Start Production Server

Start the production server after building.

## Development Commands

npm run dev - Start development server
npm run build - Create production build
npm run start - Start production server
npm run lint - Run ESLint code analysis
npm run lint:fix - Fix auto-fixable linting issues
npm run db:reset - Reset database (development only)
npm run db:setup - Setup database schema
npm run optimize - Analyze build optimization
npm run clear-cache - Clear problematic cache entries
npm run worker - Start background worker

## Docker Setup (Optional)

### Docker Compose for Development

Use the provided docker-compose.yml file to run PostgreSQL, Redis, and the application in containers. This is ideal for consistent development environments.

### Dockerfile

A production-optimized Dockerfile is included for containerized deployments. It uses multi-stage builds for minimal image size.

## Troubleshooting

### Common Issues

**Database Connection Errors*

Check if PostgreSQL is running and accessible. Verify connection strings in your environment variables.

**Redis Connection Errors*

Ensure Redis is running and the connection details are correct in your environment variables.

**Port Already in Use*

Check if port 3000 is occupied by another process and free it if necessary.

**Prisma Migration Issues*

Reset the database in development or validate the Prisma schema. Regenerate the Prisma client if needed.

**npm Install Issues*

Clear npm cache and reinstall dependencies if you encounter installation problems.

### Development Tools

**VSCode Extensions (Recommended)*

- Prisma - Prisma ORM support
- ESLint - JavaScript linting
- Prettier - Code formatting
- Tailwind CSS IntelliSense - Tailwind autocomplete
- Error Lens - Inline error highlighting

**Browser Extensions*

- React Developer Tools
- Redux DevTools (if using Redux)
- JSON Formatter

## Next Steps

1. Configure Authentication: Set up OAuth providers in your environment variables
2. Set Up Monitoring: Add Sentry DSN for error tracking
3. Configure Email: Set up email service for notifications
4. Set Up CI/CD: Configure automated testing and deployment
5. Add Custom Domains: Configure custom domain for production

## Getting Help

If you encounter issues:

1. Check the troubleshooting section
2. Review error messages in the browser console and terminal
3. Check existing GitHub issues
4. Review the documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

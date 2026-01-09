# Deployment Guide

## Vercel Deployment

### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically via GitHub Actions

### Manual Deployment

Build the application
pnpm run build

Start production server
pnpm start

## Environment Configuration

### Required Environment Variables for Production

DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=your_production_url
SENTRY_DSN=your_sentry_dsn

### Vercel-Specific Settings

1. Set Node.js version to 18+
2. Configure build command: `pnpm run build` (or leave default - it will use the build script from package.json)
3. Set output directory: `.next`
4. Configure serverless functions region
5. **For pnpm support**: The project includes `vercel.json` which configures Vercel to use pnpm. If you encounter issues, you can also set the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1` in your Vercel project settings.

## GitHub Actions CI/CD

The project includes GitHub Actions workflow for:

- Automated testing on pull requests
- Code coverage reporting
- Security scanning
- Deployment previews

## Database Migrations

### Production Migrations

Run migrations

pnpm exec prisma migrate deploy

Generate Prisma client
pnpm exec prisma generate

### Rollback Procedures

Check migration history:

pnpm exec prisma migrate status

Rollback last migration:

pnpm exec prisma migrate resolve --rolled-back "migration_name"

For emergency rollbacks, use database backup:

pg_restore -U username -d otobrix_prod backup_file.dump

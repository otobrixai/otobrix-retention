# Deployment Guide

## Vercel Deployment

### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically via GitHub Actions

### Manual Deployment

Build the application
npm run build

Start production server
npm start

## Environment Configuration

### Required Environment Variables for Production

DATABASE_URL=your_postgresql_url
REDIS_URL=your_redis_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=your_production_url
SENTRY_DSN=your_sentry_dsn

### Vercel-Specific Settings

1. Set Node.js version to 18+
2. Configure build command: `npm run build`
3. Set output directory: `.next`
4. Configure serverless functions region

## GitHub Actions CI/CD

The project includes GitHub Actions workflow for:

- Automated testing on pull requests
- Code coverage reporting
- Security scanning
- Deployment previews

## Database Migrations

### Production Migrations

Run migrations

npx prisma migrate deploy

Generate Prisma client
npx prisma generate

### Rollback Procedures

Check migration history:

npx prisma migrate status

Rollback last migration:

npx prisma migrate resolve --rolled-back "migration_name"

For emergency rollbacks, use database backup:

pg_restore -U username -d otobrix_prod backup_file.dump

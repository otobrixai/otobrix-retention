# Otobrix Admin Dashboard

![CI Pipeline](https://github.com/your-username/otobrix-retention/actions/workflows/ci.yml/badge.svg)
![Coverage](https://codecov.io/gh/your-username/otobrix-retention/branch/main/graph/badge.svg)
![Vercel](https://vercelbadge.vercel.app/api/your-username/otobrix-retention)

Enterprise client management platform built with Next.js 15, featuring real-time analytics, client management, and automated workflows.

## 📚 Documentation

For detailed documentation, please visit the [docs directory](./docs/README.md).

### Quick Links

- [Setup Guide](./docs/setup.md) - Installation and configuration
- [Security & Observability](./docs/security.md) - Security features and monitoring
- [Deployment Guide](./docs/deployment.md) - Production deployment
- [Architecture](./docs/architecture.md) - Code structure and patterns

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance

### Installation

```bash
git clone https://github.com/your-username/otobrix-retention.git
cd otobrix-retention
npm install
cp .env.example .env.local
# Edit .env.local with your values
npx prisma db push
npm run db:seed
npm run dev

# generate snapshots manually
cd C:\Users\mdmho\otobrix-retention
npx tsx scripts/generate-admin-snapshot.ts



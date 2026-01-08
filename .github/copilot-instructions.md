# Copilot Instructions for Otobrix Retention Dashboard

## Project Overview
- **Framework:** Next.js 15 (App Router, React 18)
- **Purpose:** Enterprise client management with real-time analytics, client management, and automated workflows.
- **Key Layers:**
  - **Domain:** Types, business logic, and error classes (see `src/domain/`)
  - **Repository:** Data access and persistence (see `src/domain/*/*.repository.ts`)
  - **Service:** Business logic, validation, and transactions (see `src/domain/*/*.service.ts`)
  - **Controllers:** Thin API/page controllers delegate to services (see `src/app/api/` and `src/app/store/`)


## Architecture & Patterns
- **Service/Repository Pattern:** All business logic is in services; repositories abstract DB access. Controllers are minimal.
- **Snapshot Data Flow:** Dashboard data is served via a snapshot system (see `src/app/api/dashboard/snapshot/[client_id]/route.ts` and `DashboardService`). Snapshots are adapted for UI and support cache/fresh sources.
- **Materialized Views & Advisory Locks:** RFM data is refreshed using Postgres advisory locks and materialized views (see `scripts/refresh-rfm-view.ts`).
- **Error Handling:** Error boundaries are implemented as React components (see `src/lib/errors/errorBoundary.tsx`).
- **CSRF & Rate Limiting:** Admin API routes enforce CSRF protection and rate limiting (see `src/app/api/admin/clients/route.ts`).
- **Performance:** All heavy dashboard components are dynamically/lazily loaded (see `DashboardClient.lazy.tsx`).
- **Type Safety:** Typescript throughout; domain types in `src/domain/*/*.types.ts`.

## Developer Workflows
- **Build:** `npm run build` (runs Prisma generate, then Next.js build)
- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Test:** `npm run test` (runs Vitest on `__tests__/secure.test.ts`)
- **Integration Tests:** `npm run test -- --testPathPattern=service`
- **DB Setup:** `npx prisma db push && npx prisma generate`
- **DB Reset:** `npm run db:reset`
- **Seed DB:** `npm run db:seed`
- **Snapshots:** `npx tsx scripts/generate-admin-snapshot.ts`
- **Smoke/Load Tests:** See scripts in `scripts/` (e.g., `k6:smoke`, `smoke:csrf`)


## Conventions & Integration
- **API Routes:** All API logic in `src/app/api/` (App Router conventions)
- **UI Components:** Modular, colocated in `src/components/`
- **State/Queries:** Use React Query (`@tanstack/react-query`)
- **Observability:** Sentry integrated (see `sentry.*.config.ts`)
- **Caching:** Redis via `@upstash/redis` and LRU in-memory cache (see `src/lib/cache.ts`, `src/lib/cache/memory-cache.ts`). Use `CACHE_KEYS` and `generateCacheKey` for cache key conventions.
- **Notifications:** Notification logic is derived from dashboard data changes (see `src/domain/notifications/deriveNotifications.ts`).
- **Auth:** NextAuth.js, custom logic in `src/lib/auth.ts`
- **Environment:** Use `.env.local` for secrets/config

## Key Files & Directories
- `src/domain/` — Domain logic, types, services, repositories
- `src/app/` — App Router pages, API routes, layouts
- `src/components/` — UI components
- `scripts/` — Utility, smoke, and load test scripts
- `prisma/` — Prisma schema and seed scripts
- `docs/` — Architecture, setup, and security docs


## Examples
- To add a new business rule: implement in `*.service.ts`, not in controllers.
- To add a new API endpoint: create route in `src/app/api/`, call service layer.
- For DB changes: update `prisma/schema.prisma`, run `npx prisma db push`.
- To update dashboard data logic: modify snapshot adaptation in `DashboardService` and/or snapshot fetch in `src/app/api/dashboard/snapshot/[client_id]/route.ts`.
- To change notification rules: update `src/domain/notifications/deriveNotifications.ts`.
- To refresh RFM data: see advisory lock/materialized view logic in `scripts/refresh-rfm-view.ts`.

---
For more, see `docs/architecture.md` and `docs/README.md`.

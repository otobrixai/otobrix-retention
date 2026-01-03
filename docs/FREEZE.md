# ADMIN DASHBOARD FREEZE - LOAD-SAFE ARCHITECTURE

## Architecture

- **Read Path**: DashboardSnapshot → UI (O(1))
- **Write Path**: Cron → generate-admin-snapshot.ts → DashboardSnapshot
- **No Live Aggregation**: All .count() removed from API routes

## Safety Guarantees

1. **Advisory Locking**: Prevents concurrent snapshot writes
2. **Size Limits**: 50KB max per snapshot, 20 recent clients
3. **Version Guard**: Only v1 snapshots accepted
4. **Graceful Degradation**: UI shows "refreshing" not errors

## Monitoring

- Dashboard latency: <100ms (p95)
- Snapshot freshness: <15 minutes
- Lock contention: <1% of writes

## Cron Schedule

```bash
*/15 * * * * cd /app && npx tsx scripts/generate-admin-snapshot.ts

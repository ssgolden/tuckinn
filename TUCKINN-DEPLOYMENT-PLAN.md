# Tuckinn Platform — Deployment Verification & Final Fixes Plan

**Generated**: 2026-04-14
**Planner**: Super Pi Swarm (architect + swarm-planner)
**Status**: Local builds pass → Need VPS deployment verification

---

## Current State Assessment

### ✅ Already Fixed (Verified by local build)
| Issue | Status | Evidence |
|-------|--------|----------|
| TypeScript compilation errors | ✅ Fixed | `catalog-data.ts` exists, imports resolved |
| Hardcoded dev credentials | ✅ Fixed | `auth-context.tsx` uses proper login flow |
| ES module imports | ✅ Fixed | `auth.service.ts` uses `import jwt from` |
| .gitignore secrets | ✅ Fixed | platform/.gitignore excludes .env files |
| Build system | ✅ Fixed | All 4 apps (admin, staff, storefront, api) build |

### ✅ VPS Status (Verified 2026-04-14)
| Item | Status | Evidence |
|------|--------|----------|
| All 7 containers | ✅ Running | postgres, redis, api, storefront, staff, admin, caddy all healthy |
| API endpoint | ✅ Working | `/api/catalog/public` returns 6 categories, 34 products, modifier groups |
| Database | ✅ Healthy | 2 users, 30 tables, all migrations applied |
| Media uploads | ✅ Working | Product images accessible at `/uploads/` endpoint |

### ⚠️ Needs VPS Verification
| Issue | Severity | VPS Check Required |
|-------|----------|-------------------|
| Runtime API errors on VPS | HIGH | `require()` vs `import` in transpiled JS |
| Staff Socket.IO JWT auth | HIGH | Platform staff needs auth token |
| Media upload CORS/proxy | MEDIUM | Admin file upload through proxy |
| Session cross-contamination | MEDIUM | Storefront writing admin keys |
| Database Prisma version | MEDIUM | Schema sync + migration status |
| Docker production config | LOW | Seed script + entrypoint |

### 🔍 VPS Health Check Needed
- [ ] All 7 containers running (postgres, redis, api, admin, staff, storefront, caddy)
- [ ] API endpoints responding `200`
- [ ] WebSocket connections working
- [ ] JWT auth flow functional
- [ ] Database migrations applied
- [ ] Media uploads working

---

## Dependency Graph

```
Wave 1: Verify & Sync ───────────────┐
  T1: VPS SSH + container status      │
  T2: Database health check           │
  T3: Compare local/VPS file tree     │
                                     ▼
Wave 2: Critical Runtime ────────────┐
  T4: Test all API endpoints          │
  T5: Fix API require()>import issues  │ depends on T1
  T6: Fix staff Socket.IO auth        │ depends on T1
  T7: Fix proxy multipart uploads     │ depends on T4
                                     ▼
Wave 3: Data Integrity ───────────────┐
  T8: Run Prisma migrations           │ depends on T2
  T9: Seed if needed                  │ depends on T8
  T10: Fix session contamination      │ depends on T6
                                     ▼
Wave 4: Deploy ───────────────────┐
  T11: Rebuild + push images          │ depends on T5, T6, T7
  T12: Restart stack                  │ depends on T11
  T13: End-to-end verification        │ depends on T12
```

---

## Tasks

### T1: VPS SSH + Container Status Check
- **depends_on**: []
- **location**: VPS `187.124.217.8`
- **description**: SSH to VPS, check all 7 containers running, verify healthy status
- **commands**:
  ```bash
  ssh root@187.124.217.8
  cd /opt/tuckinn/platform/infra/docker
  docker compose -f docker-compose.prod.yml ps
  docker compose logs --tail=50 <service>
  ```
- **validation**: All containers show `Up` and `healthy`
- **status**: Not Completed
- **log**: [empty]

### T2: Database Health Check
- **depends_on**: []
- **location**: VPS PostgreSQL
- **description**: Connect to PostgreSQL, verify tables exist, check migration status
- **commands**:
  ```bash
  docker exec -it tuckinn-postgres psql -U postgres -d tuckinn -c "SELECT COUNT(*) FROM \"User\";"
  docker exec -it tuckinn-api npx prisma migrate status
  ```
- **validation**: Returns user count > 0, migration status current
- **status**: Not Completed
- **log**: [empty]

### T3: Compare Local vs VPS File Tree
- **depends_on**: []
- **location**: Local + VPS
- **description**: Compare platform/apps/api/src on local vs VPS to verify sync
- **commands**:
  ```bash
  # Local
  find platform/apps/api/src -type f -name "*.ts" | sort > local-files.txt
  # VPS (via SSH)
  find /opt/tuckinn/platform/apps/api/src -type f -name "*.ts" | sort > vps-files.txt
  diff local-files.txt vps-files.txt
  ```
- **validation**: No significant differences found
- **status**: Not Completed
- **log**: [empty]

### T4: Test All API Endpoints
- **depends_on**: [T1]
- **location**: VPS API
- **description**: Run smoke tests on all API endpoints to identify runtime errors
- **commands**:
  ```bash
  curl -s https://api.187.124.217.8.sslip.io/api/health
  curl -s https://api.187.124.217.8.sslip.io/api/catalog/public
  curl -s https://api.187.124.217.8.sslip.io/api/auth/staff/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  ```
- **validation**: All endpoints return proper JSON (even login with wrong creds should return 401, not 500)
- **status**: Not Completed
- **log**: [empty]

### T5: Fix API require()→import Issues
- **depends_on**: [T1, T4]
- **location**: `platform/apps/api/` (all *.service.ts, *.guard.ts files)
- **description**: Find and fix any remaining require() statements; verify transpiled JS uses ESM
- **commands**:
  ```bash
  grep -r "require(" platform/apps/api/src --include="*.ts"
  # Also check in Docker container after build:
  docker exec tuckinn-api grep -r "require(" /app/dist --include="*.js" || echo "Clean"
  ```
- **validation**: No require() in TypeScript source or transpiled JS
- **status**: Not Completed
- **log**: [empty]

### T6: Fix Staff Socket.IO JWT Auth
- **depends_on**: [T1]
- **location**: `platform/apps/staff/app/page.tsx` + Socket.IO init
- **description**: Staff app needs to pass JWT token in Socket.IO auth handshake
- **fix**:
  ```typescript
  // In staff Socket.IO initialization:
  const token = localStorage.getItem("tuckinn.staff.session");
  const session = token ? JSON.parse(token) : null;
  const socket = io(SOCKET_BASE_URL, {
    transports: ["websocket"],
    withCredentials: true,
    auth: { token: session?.accessToken },
  });
  ```
- **validation**: Socket.IO connects with auth token visible in network tab
- **status**: Not Completed
- **log**: [empty]

### T7: Fix Admin Proxy Multipart Uploads
- **depends_on**: [T4]
- **location**: `platform/apps/admin/src/app/api/proxy/[...path]/route.ts`
- **description**: Proxy incorrectly sets Content-Type for multipart uploads
- **fix**: Detect multipart requests, forward body without modification
- **validation**: File uploads work through admin → API
- **status**: Not Completed
- **log**: [empty]

### T8: Run Prisma Migrations
- **depends_on**: [T2]
- **location**: VPS API container
- **description**: Apply any pending database migrations
- **commands**:
  ```bash
  docker exec -it tuckinn-api npx prisma migrate deploy
  ```
- **validation**: Migration completes successfully, no pending migrations
- **status**: Not Completed
- **log**: [empty]

### T9: Seed Database if Needed
- **depends_on**: [T8]
- **location**: VPS API container
- **description**: If User table empty, run seed script
- **commands**:
  ```bash
  docker exec -it tuckinn-api npx tsx prisma/seed.ts
  ```
- **validation**: Seed data exists (admin user, categories, products)
- **status**: Not Completed
- **log**: [empty]

### T10: Fix Session Cross-Contamination
- **depends_on**: [T6]
- **location**: `platform/apps/storefront/lib/api.ts`
- **description**: Remove storefront writes to tuckinn.admin.session keys
- **fix**: Remove `localStorage.setItem("tuckinn.admin.session", ...)` from storefront
- **validation**: Storefront only manages its own session
- **status**: Not Completed
- **log**: [empty]

### T11: Rebuild + Push Docker Images
- **depends_on**: [T5, T6, T7]
- **location**: VPS /opt/tuckinn/platform
- **description**: Rebuild all services with fixes
- **commands**:
  ```bash
  cd /opt/tuckinn/platform/infra/docker
  docker compose -f docker-compose.prod.yml build --no-cache api admin staff storefront
  ```
- **validation**: Build completes without errors
- **status**: Not Completed
- **log**: [empty]

### T12: Restart Stack
- **depends_on**: [T11]
- **location**: VPS
- **description**: Deploy updated containers
- **commands**:
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```
- **validation**: All containers healthy, zero downtime deploy
- **status**: Not Completed
- **log**: [empty]

### T13: End-to-End Verification
- **depends_on**: [T12]
- **location**: All services
- **description**: Full smoke test of all user flows
- **tests**:
  - [ ] Admin login
  - [ ] Create product
  - [ ] Upload product image
  - [ ] Storefront browse menu
  - [ ] Place order
  - [ ] Staff receives notification
  - [ ] Staff updates order status
- **validation**: All 7 acceptance tests pass
- **status**: Not Completed
- **log**: [empty]

---

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1, T2, T3 | Immediately (local + SSH) |
| 2 | T4, T5, T6, T7 | Wave 1 complete |
| 3 | T8, T9, T10 | Wave 2 complete |
| 4 | T11, T12, T13 | Wave 3 complete |

---

## Testing Strategy

### Unit Tests
- Run in `platform/apps/api`: `pnpm test`
- Run in `platform/apps/admin`: `pnpm test`

### Integration Tests (VPS)
After T12 (stack restart):
```bash
# Health check
for service in api admin staff storefront; do
  curl -sf "https://${service}.187.124.217.8.sslip.io/health" || echo "FAIL: $service"
done

# Auth flow
curl -sf "https://api.187.124.217.8.sslip.io/api/auth/staff/login" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"RichRonHoll@tuckinn.local","password":"Tuckinn2026!"}' \
  -o /dev/null && echo "Auth OK" || echo "Auth FAIL"
```

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Prisma version mismatch on VPS | Medium | High | Check versions first (T2) |
| Docker build cache issues | Low | Medium | Use `--no-cache` flag |
| Database corruption on seed | Low | HIGH | Backup DB before T9 |
| JWT secret mismatch | Medium | High | Verify .env.production matches |
| Caddy config conflicts | Low | Medium | Check Caddyfile before restart |

---

## VPS Connection Details

- **IP**: 187.124.217.8
- **SSH**: root@187.124.217.8
- **App Path**: /opt/tuckinn/platform/
- **Docker Path**: /opt/tuckinn/platform/infra/docker/

**Quick Status Check**:
```bash
ssh root@187.124.217.8 "cd /opt/tuckinn/platform/infra/docker && docker compose -f docker-compose.prod.yml ps"
```

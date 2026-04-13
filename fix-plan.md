# Tuckinn P New — Comprehensive Fix Plan

**Created:** 2026-04-13
**Source:** 3-agent parallel audit of root legacy code, backend server, and platform monorepo
**Total findings:** 40+ bugs across 5 severity levels

---

## Execution Strategy

```
WAVE 1 (Critical Security + Build-Breaking) — All parallel, no deps
  Task 1: Fix storefront TypeScript compilation errors
  Task 2: Remove hardcoded dev credentials from admin auth-context
  Task 3: Fix static file serving exposing secrets (root + backend servers)
  Task 4: Fix .gitignore to exclude .env files from version control

WAVE 2 (Runtime Bugs) — All parallel, no deps between them
  Task 5: Fix root server_sqljs.js bugs (JSON parse crash, WebSocket auth, order number loop, static serving)
  Task 6: Fix backend/server.js bugs (input sanitization, cascade delete, session cookie, multer errors)
  Task 7: Fix storefront app.js/index.html bugs (hardcoded localhost, menu error handling, justAdded reactivity)
  Task 8: Fix staff app bugs (Socket.IO auth, double polling, external audio, missing lib/api)
  Task 9: Fix platform API bugs (require→import, empty modules, carts auth, PrismaService env loading)

WAVE 3 (Architecture + Phase 1 Features) — After Wave 2
  Task 10: Add missing API endpoints (password change, webhooks config, notifications config, analytics)
  Task 11: Implement admin Phase 1 features (password change UI, webhooks real data, notifications persistence)
  Task 12: Fix Prisma version conflict + seed script
  Task 13: Fix Docker production configuration (seed command, entrypoint, .gitignore)
```

---

## WAVE 1 — Critical Security + Build-Breaking Fixes

### Task 1: Fix Storefront TypeScript Compilation Errors
**Severity:** CRITICAL (build-breaking)
**Files:**
- `platform/apps/storefront/app/_storefront/menu-jsonld.tsx`
- `platform/apps/storefront/app/_storefront/ssr-catalog.tsx`
- **NEW:** `platform/apps/storefront/lib/catalog-data.ts`

**Errors:**
```
menu-jsonld.tsx(1,30): error TS2307: Cannot find module '../../lib/catalog-data'
ssr-catalog.tsx(1,30): error TS2307: Cannot find module '../../lib/catalog-data'
menu-jsonld.tsx(11,36): error TS7006: Parameter 'cat' implicitly has an 'any' type
menu-jsonld.tsx(14,37): error TS7006: Parameter 'p' implicitly has an 'any' type
ssr-catalog.tsx(10,23): error TS7006: Parameter 'cat' implicitly has an 'any' type
ssr-catalog.tsx(14,31): error TS7006: Parameter 'p' implicitly has an 'any' type
```

**Fix:**
1. Create `platform/apps/storefront/lib/catalog-data.ts`
2. Export `fetchCatalog()` that calls the API `GET /catalog/public?locationCode=main` and returns typed data
3. Import the `PublicCatalogResponse` type from `./api.ts`
4. The implicit `any` errors resolve once the import resolves with proper types

```typescript
// platform/apps/storefront/lib/catalog-data.ts
import { apiFetch, type PublicCatalogResponse } from "./api";

export async function fetchCatalog(): Promise<PublicCatalogResponse["categories"]> {
  const data = await apiFetch<PublicCatalogResponse>("/catalog/public?locationCode=main");
  return data.categories;
}
```

### Task 2: Remove Hardcoded Dev Credentials from Admin Auth
**Severity:** CRITICAL (security — credentials visible in client bundle)
**File:** `platform/apps/admin/src/lib/auth-context.tsx`

**Problem:**
- Lines 41-42: `DEV_EMAIL = "richronholl@tuckinn.local"`, `DEV_PASSWORD = "Tuckinn2026!"`
- Lines 63-81: Auto-login with hardcoded credentials; on failure creates fake `dev-fallback` session
- The fake session makes ALL API calls fail with 401 but UI shows as "logged in"

**Fix:**
1. Replace hardcoded credentials with `NEXT_PUBLIC_DEV_MODE` env var check
2. If `NEXT_PUBLIC_DEV_MODE=true`, auto-login using stored credentials (not hardcoded)
3. If `NEXT_PUBLIC_DEV_MODE` is not set or false, show login page normally
4. Remove the fake `dev-fallback` session entirely — if login fails, show login form
5. Add `.env.local` in admin with `NEXT_PUBLIC_DEV_MODE=true` for development only

```typescript
// Replace lines 41-81 with:
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const existing = loadAdminSession();
      if (existing) {
        try {
          const refreshed = await refreshAdminSession(existing.refreshToken);
          saveAdminSession(refreshed);
          setSession(refreshed);
          setIsLoading(false);
          return;
        } catch {
          clearAdminSession();
        }
      }
      // No auto-login in production. Show login form.
      setIsLoading(false);
    })();
  }, []);
  // ...
}
```

### Task 3: Fix Static File Serving Exposing Secrets
**Severity:** CRITICAL (security — `.env`, `database.sqlite` accessible via HTTP)
**Files:**
- `server_sqljs.js` (line 23, 805) — `STATIC_ROOT = path.join(__dirname, '.')`
- `backend/server.js` (lines 537-540) — `FRONTEND_DIR = path.join(__dirname, '..')`

**Fix for `server_sqljs.js`:**
```javascript
// Replace line 23:
const STATIC_ROOT = path.join(__dirname, 'public');
// Create public/ directory, move index.html, style.css, app.js, staff.html, staff.js, staff.css, admin-qr.html there
// Keep database.sqlite, .env, server_sqljs.js OUT of public/
```

**Fix for `backend/server.js`:**
```javascript
// Replace lines 537-540:
const FRONTEND_DIR = path.join(__dirname, 'admin');
// Only serve the admin/ subdirectory, not the entire parent project
```

### Task 4: Fix .gitignore to Exclude Secrets
**Severity:** CRITICAL (security — secrets tracked in git)
**File:** `platform/.gitignore`

**Current content (only 4 lines):**
```
node_modules
dist
.next
.turbo
```

**Add:**
```
.env
.env.*
!.env.example
!.env.production.example
database.sqlite
*.db
```

**After fixing .gitignore:** Run `git rm --cached .env` to stop tracking the secrets file. Rotate the Stripe keys and JWT secrets since they're already in git history.

---

## WAVE 2 — Runtime Bug Fixes

### Task 5: Fix root server_sqljs.js Bugs
**Files:** `server_sqljs.js`

**5a. JSON.parse crash on malformed items (line 372):**
```javascript
// Replace:
const items = JSON.parse(row.items || '[]');
// With:
let items;
try { items = JSON.parse(row.items || '[]'); } catch { items = []; }
```

**5b. Socket.IO session auth may fail on WebSocket upgrade (lines 103-108):**
```javascript
// Add cookie-based fallback: if session.cookie not available on upgrade,
// allow connection but defer auth check to first event
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.staffAuthenticated) return next();
  // Allow connection, verify on event
  next();
});
// Then verify auth on each event handler
```

**5c. generateOrderNumber infinite loop risk (lines 400-408):**
```javascript
// Add max retry limit:
let attempts = 0;
do {
  orderNumber = generateOrderNumber();
  existing = findOrder(orderNumber);
  attempts++;
} while (existing && attempts < 10);
if (existing) throw new Error('Unable to generate unique order number');
```

### Task 6: Fix backend/server.js Bugs
**Files:** `backend/server.js`

**6a. No input sanitization:**
- Add `sanitizeText()` function matching root server's implementation
- Apply to all user-supplied string inputs before DB insertion

**6b. Category delete doesn't cascade items:**
- Before deleting a category, explicitly delete all menu_items with matching category_slug
- Or enable SQLite foreign key enforcement: `db.run('PRAGMA foreign_keys = ON')`

**6c. PUT /categories/:slug doesn't update items:**
- When category slug changes, UPDATE menu_items SET category_slug = newSlug WHERE category_slug = oldSlug

**6d. Session cookie secure flag:**
```javascript
// Replace:
cookie: { httpOnly: true, sameSite: 'lax', secure: false }
// With:
cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
```

**6e. Multer error handler returns 400 for all errors:**
- Distinguish file-too-large (413) from general errors (500)

### Task 7: Fix Storefront index.html/app.js Bugs
**Files:** `index.html`, `app.js`

**7a. Hardcoded localhost API URL:**
```html
<!-- Replace line 10: -->
<script>window.TUCKINN_API_BASE = 'http://localhost:3005/api';</script>
<!-- With: -->
<script>window.TUCKINN_API_BASE = window.TUCKINN_API_BASE || '/api';</script>
<!-- The || '/api' fallback already exists in app.js, but the hardcoded value overrides it -->
```
Actually, the simpler fix is to remove the `<script>` tag entirely from `index.html` since `app.js` line 1 already has the fallback logic.

**7b. No menu load error handling/retry:**
- Add a "Retry" button in the error toast when menu load fails
- Show a proper empty state instead of empty category headers

**7c. Alpine.js justAdded reactivity:**
- Use `Alpine.reactive()` or `Object.defineProperty` to ensure `justAdded` property triggers UI updates

### Task 8: Fix Staff App Bugs
**Files:** `staff.js`, `staff.html`, platform `apps/staff/app/page.tsx`

**8a. Platform staff app — Socket.IO missing JWT auth:**
```typescript
// In staff app, add auth token to socket connection:
const token = localStorage.getItem("tuckinn.staff.session");
const session = token ? JSON.parse(token) : null;
const socket = io(SOCKET_BASE_URL, {
  transports: ["websocket"],
  withCredentials: true,
  auth: { token: session?.accessToken },
});
```

**8b. Legacy staff.js — double polling:**
```javascript
// Remove the 5-second polling interval when Socket.IO is connected
// Only use polling as a fallback when socket fails
let pollInterval;
socket.on('connect', () => { clearInterval(pollInterval); });
socket.on('disconnect', () => {
  pollInterval = setInterval(refreshBoard, 5000);
});
```

**8c. External audio URL:**
- Replace `https://www.soundjay.com/buttons/sounds/button-09a.mp3` with a local audio file in `staff/` or embed a base64-encoded notification sound

### Task 9: Fix Platform API Bugs
**Files:** Various in `platform/apps/api/src/`

**9a. Replace `require()` with ES imports:**
- `auth/auth.service.ts` line 23: `const jwt = require("jsonwebtoken")` → `import jwt from "jsonwebtoken"`
- `auth/jwt-auth.guard.ts` line 19: same
- `realtime/realtime.gateway.ts` line 13: same
- `payments/payments.service.ts` line 18: `const stripeFactory = require("stripe")` → `import Stripe from "stripe"`

**9b. Remove or implement empty NestJS modules:**
- Either remove from `app.module.ts` imports: `NotificationsModule`, `AnalyticsModule`, `AuditModule`, `PricingModule`, `PromotionsModule`, `CustomersModule`
- Or add minimal controllers/services to each

**9c. Add auth guards to carts controller:**
- Add `@UseGuards(OptionalJwtAuthGuard)` to cart read endpoints
- At minimum, add rate limiting to prevent cart enumeration

**9d. Fix PrismaService duplicate env loading:**
- Remove `loadEnvironmentFiles()` from `prisma.service.ts`
- Rely on `@nestjs/config` `AppConfigModule` which already loads `.env` files
- Ensure `AppConfigModule` is loaded before `PrismaModule`

**9e. Fix admin API proxy for file uploads:**
- File: `platform/apps/admin/src/app/api/proxy/[...path]/route.ts`
- Don't set `Content-Type: application/json` for `multipart/form-data` requests
- Forward the request body as-is for non-JSON content types

**9f. Fix storefront cross-app session contamination:**
- File: `platform/apps/storefront/lib/api.ts` lines 157-160
- Remove the writes to `tuckinn.admin.session` and `tuckinn.staff.session` from `saveBackOfficeSession()`
- Each app should only manage its own session keys

---

## WAVE 3 — Architecture + Phase 1 Features

### Task 10: Add Missing API Endpoints
**New files in `platform/apps/api/src/`:**

1. `auth/auth.controller.ts` — Add `PATCH /auth/password` endpoint
2. `webhooks/webhooks.controller.ts` — Add `GET /webhooks/events` and `GET/PATCH /webhooks/config`
3. `notifications/notifications.controller.ts` — Add `GET/PATCH /notifications/config`
4. `analytics/analytics.controller.ts` — Add `GET /analytics/dashboard`

### Task 11: Admin Phase 1 Features
**Files in `platform/apps/admin/src/app/(admin)/`:**

1. `settings/profile/page.tsx` — Wire password change form to `PATCH /auth/password`
2. `settings/webhooks/page.tsx` — Replace hardcoded `sampleEvents` with real API data
3. `notifications/page.tsx` — Replace localStorage with API calls to `GET/PATCH /notifications/config`

### Task 12: Fix Prisma + Seed
**Files:**
- `platform/package.json` — Remove `"@prisma/client": "^6.19.3"` (only needed in API)
- `platform/apps/api/package.json` — Update `"@prisma/client": "^6.19.3"` to match root
- `platform/infra/docker/api-entrypoint.sh` — Fix `node ./prisma/seed.js` to use `tsx ../../prisma/seed.ts`

### Task 13: Fix Docker Production Config
**Files in `platform/infra/docker/`:**

1. Fix seed service command to use correct path and runtime
2. Ensure `.env` is excluded from Docker context via `.dockerignore`
3. Add `.env` and `*.sqlite` to platform `.gitignore`
4. Verify Caddyfile TLS configuration for production domains

---

## @base-ui/react Reminder
All components use `render` prop, NOT `asChild`. This caused the original VPS 404 bug.

## Price Format Reminder
API returns prices in **EUR** (e.g., `9.95`, not `995`). All `formatPrice` functions must use `€${Number(amount).toFixed(2)}` without division.

## API Proxy Reminder
In dev, all API calls go through `/api/proxy/[...path]` to bypass CORS. Production uses `NEXT_PUBLIC_API_BASE_URL` directly.
# Phase 1 Platform Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `platform/` buildable, safer, and operationally sane so future refactors and launch work have a stable base.

**Architecture:** Phase 1 treats `platform/` as the production source of truth and focuses on build determinism, environment safety, workspace hygiene, and removal of high-risk hardcoded values. The legacy root app remains untouched except for documentation and repo hygiene boundaries.

**Tech Stack:** pnpm workspace, Turbo, Next.js 15, React 19, NestJS 10, Prisma, TypeScript, PowerShell, Git worktrees

---

## File Structure Map

**Primary files in Phase 1**

- Modify: `platform/package.json`
- Create or restore: `platform/pnpm-lock.yaml`
- Modify: `platform/.gitignore`
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/lib/api.ts`
- Modify: `platform/apps/admin/lib/api.ts`
- Modify: `platform/apps/staff/lib/api.ts`
- Modify: `platform/packages/api-client/src/index.ts`
- Modify: `platform/apps/api/src/payments/payments.service.ts`
- Modify: `.gitignore`
- Modify: `PROJECT_PROGRESS.md`
- Create: `docs/superpowers/plans/2026-04-09-phase-1-platform-stabilization.md`

**Likely follow-up files if Phase 1 uncovers missing config**

- Modify: `platform/.env.example`
- Modify: `platform/.env.production.example`
- Modify: `platform/docs/operations/local-setup.md`
- Modify: `platform/docs/operations/runtime-integration.md`

**Not in scope for Phase 1**

- Large UI refactors in `platform/apps/storefront/app/page.tsx`
- Admin/staff modularization
- Mobile app work
- Legacy root prototype migration/removal
- New feature development

---

### Task 1: Restore Deterministic Workspace Installs

**Files:**
- Modify: `platform/package.json`
- Create or restore: `platform/pnpm-lock.yaml`
- Modify: `platform/.gitignore`

- [ ] **Step 1: Capture the failing baseline**

Run:

```powershell
pnpm install --frozen-lockfile
pnpm build
```

Expected:
- `pnpm install --frozen-lockfile` fails because `pnpm-lock.yaml` is missing.
- `pnpm build` fails because workspace dependencies are not installed and `turbo` cannot run.

- [ ] **Step 2: Restore workspace package installation**

Run:

```powershell
pnpm install --no-frozen-lockfile
```

Expected:
- `platform/node_modules` is created.
- `platform/pnpm-lock.yaml` is generated or restored in the worktree.

- [ ] **Step 3: Verify the install is now deterministic**

Run:

```powershell
pnpm install --frozen-lockfile
```

Expected:
- install completes successfully using the committed lockfile.

- [ ] **Step 4: Add workspace hygiene ignores**

Ensure `platform/.gitignore` ignores generated and local-only files such as:

```gitignore
node_modules/
.turbo/
.next/
dist/
.expo/
*.tsbuildinfo
runtime-logs/
tmp-*.png
```

- [ ] **Step 5: Re-run the build gate**

Run:

```powershell
pnpm build
```

Expected:
- build now advances far enough to reveal real application-level failures instead of workspace setup failures.

---

### Task 2: Remove Public Hardcoded Credentials and Localhost Footguns

**Files:**
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/lib/api.ts`
- Modify: `platform/apps/admin/lib/api.ts`
- Modify: `platform/apps/staff/lib/api.ts`
- Modify: `platform/packages/api-client/src/index.ts`

- [ ] **Step 1: Capture the failing security baseline**

Run:

```powershell
rg -n "ChangeMe123|admin@tuckinn\.local|http://localhost:3200/api|http://localhost:3101|http://localhost:3102" platform
```

Expected:
- matches appear in storefront and shared client files.

- [ ] **Step 2: Remove hardcoded back-office defaults from the public storefront**

Replace:

```ts
const [authForm, setAuthForm] = useState({
  email: "admin@tuckinn.local",
  password: "ChangeMe123!"
});
```

With:

```ts
const [authForm, setAuthForm] = useState({
  email: "",
  password: ""
});
```

- [ ] **Step 3: Replace direct localhost UI links with environment-backed URLs**

Normalize all app URL access through shared config helpers so the storefront only uses exported constants and never inlines:

```ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200/api";
```

And in UI:

```ts
openDashboard(API_BASE_URL.replace(/\/api$/, ""));
```

- [ ] **Step 4: Align shared API client fallback names**

Ensure `platform/packages/api-client/src/index.ts` uses the same public env naming convention as the apps. Remove divergent fallback names such as `NEXT_PUBLIC_API_URL` if the apps standardize on `NEXT_PUBLIC_API_BASE_URL`.

- [ ] **Step 5: Verify removal**

Run:

```powershell
rg -n "ChangeMe123|admin@tuckinn\.local" platform
```

Expected:
- no matches remain in active source files.

---

### Task 3: Remove Hardcoded Payment Redirect Fallbacks

**Files:**
- Modify: `platform/apps/api/src/payments/payments.service.ts`
- Modify: `platform/.env.example`
- Modify: `platform/.env.production.example`
- Modify: `platform/docs/operations/runtime-integration.md`

- [ ] **Step 1: Capture the current fallback**

Run:

```powershell
rg -n "sslip\.io|STORE_DOMAIN|getStorefrontUrl" platform/apps/api/src/payments/payments.service.ts platform/.env.example platform/.env.production.example
```

Expected:
- hardcoded `sslip.io` fallback is present in the payment service.

- [ ] **Step 2: Centralize storefront URL resolution**

Replace the hardcoded fallback:

```ts
const storefrontUrl = input.storefrontUrl || "https://187.124.217.8.sslip.io";
```

With resolution based on validated environment values:

```ts
const storefrontUrl = input.storefrontUrl || this.getStorefrontUrl();
```

And make `getStorefrontUrl()` prefer explicit environment variables for production-safe redirects.

- [ ] **Step 3: Document required environment variables**

Update examples to clearly define the expected storefront and API domain variables used in local and production setups.

- [ ] **Step 4: Verify the new behavior**

Run:

```powershell
rg -n "sslip\.io" platform/apps/api/src/payments/payments.service.ts
```

Expected:
- no hardcoded deployment hostname remains in the payment service.

---

### Task 4: Clean Git Noise At The Repo Root

**Files:**
- Modify: `.gitignore`
- Modify: `PROJECT_PROGRESS.md`

- [ ] **Step 1: Capture current git noise**

Run:

```powershell
git status --short
```

Expected:
- backups, generated files, logs, and local app artifacts clutter the output.

- [ ] **Step 2: Expand root ignore rules**

Add ignores for local-only clutter, including:

```gitignore
backup/
backup_*/
deployment_package_*/
platform/apps/mobile/.expo/
platform/**/*.tsbuildinfo
platform/node_modules/
platform/.turbo/
platform/tmp-*.png
run-*.log
run-*.err.log
```

- [ ] **Step 3: Re-verify git status**

Run:

```powershell
git status --short
```

Expected:
- existing intentional source edits remain visible.
- backup and generated noise is substantially reduced.

---

### Task 5: Record the Stabilization Boundary

**Files:**
- Modify: `PROJECT_PROGRESS.md`

- [ ] **Step 1: Add a short Phase 1 note**

Document that:
- `platform/` is the production source of truth.
- Phase 1 is about build determinism, config safety, and repo hygiene.
- Large UI refactors and launch hardening move to later phases.

- [ ] **Step 2: Verify the final Phase 1 gate**

Run:

```powershell
pnpm install --frozen-lockfile
pnpm build
rg -n "ChangeMe123|admin@tuckinn\.local|sslip\.io" platform
git status --short
```

Expected:
- workspace install succeeds deterministically.
- build either passes or fails only on known app-level issues that are explicitly reported.
- credential and stale-hostname matches are removed from active source.
- repo status is cleaner and easier to review.

---

## Follow-On Phases After Phase 1

1. **Phase 2: Checkout and payment hardening**
   - remove `// @ts-nocheck`
   - add checkout/payment integration tests
   - validate webhook and idempotency flows

2. **Phase 3: Web app decomposition**
   - split storefront/admin/staff giant page files
   - move shared auth and API logic into packages

3. **Phase 4: Quality gates**
   - CI build/typecheck/test
   - Playwright smoke flows
   - deployment smoke checks

4. **Phase 5: Launch hardening**
   - real domains
   - monitoring and alerts
   - admin/staff access controls
   - backup/restore drills

---

## Self-Review

- Spec coverage: This plan covers the agreed Phase 1 stabilization scope only: deterministic installs, build gate, config safety, and repo hygiene.
- Placeholder scan: No `TODO`/`TBD` placeholders remain.
- Type consistency: `NEXT_PUBLIC_API_BASE_URL` and storefront URL handling are kept as the intended shared config direction across the plan.

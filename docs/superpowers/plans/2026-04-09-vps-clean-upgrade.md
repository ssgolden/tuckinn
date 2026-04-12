# Tuckinn VPS Clean Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the new Tuckinn storefront, admin, staff, API, and supporting runtime stack to the VPS with a short maintenance window, verified smoke checks, and a documented rollback path.

**Architecture:** Keep the current single-VPS Docker Compose topology and perform a controlled in-place upgrade. Protect the release with preflight checks, a PostgreSQL backup, explicit migration execution, domain-by-domain smoke tests, and application-layer rollback commands.

**Tech Stack:** Docker Compose, Caddy, Next.js, NestJS, Prisma, PostgreSQL, Redis, pnpm, bash, Git

---

### Task 1: Freeze The Release Candidate

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\admin`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\staff`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\api`

- [ ] **Step 1: Confirm the local release candidate still builds**

Run:

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
pnpm --filter @tuckinn/api test -- --runInBand
pnpm --filter @tuckinn/api build
pnpm --filter @tuckinn/storefront build
pnpm --filter @tuckinn/admin build
pnpm --filter @tuckinn/staff build
pnpm build
```

Expected:

```text
All listed commands exit 0.
```

- [ ] **Step 2: Record the release commit that will be deployed**

Run:

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new"
git rev-parse HEAD
git status --short
```

Expected:

```text
You have one SHA for the release candidate and a clear view of any uncommitted changes.
```

- [ ] **Step 3: Decide whether to deploy by commit or by current working tree**

Rule:

```text
If there are uncommitted release-critical changes, commit them before deploy.
Do not deploy an ambiguous local state.
```

- [ ] **Step 4: Commit the release candidate if needed**

Run:

```powershell
git add .
git commit -m "release: prepare vps upgrade candidate"
```

Expected:

```text
The release candidate is represented by a single deployable commit.
```

### Task 2: Audit Production Runtime Inputs

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\.env.production.example`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\docker-compose.prod.yml`

- [ ] **Step 1: Build a production env checklist from the repo**

Checklist:

```text
STORE_DOMAIN
ADMIN_DOMAIN
STAFF_DOMAIN
API_DOMAIN
DATABASE_URL
REDIS_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
AWS_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
ALLOWED_ORIGINS
```

- [ ] **Step 2: Verify the live VPS `.env.production` contains every required key**

Run on the VPS:

```bash
cd /opt/tuckinn-platform/platform
grep -E '^(STORE_DOMAIN|ADMIN_DOMAIN|STAFF_DOMAIN|API_DOMAIN|DATABASE_URL|REDIS_URL|POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD|JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|SEED_ADMIN_EMAIL|SEED_ADMIN_PASSWORD|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|AWS_REGION|S3_BUCKET|S3_ACCESS_KEY_ID|S3_SECRET_ACCESS_KEY|ALLOWED_ORIGINS)=' .env.production
```

Expected:

```text
Every required key is present exactly once.
```

- [ ] **Step 3: Verify no placeholder secrets remain in VPS production env**

Run on the VPS:

```bash
cd /opt/tuckinn-platform/platform
grep -nE 'change-me|replace-me|replace-with-strong|sk_live_replace_me|pk_live_replace_me|whsec_replace_me' .env.production && exit 1 || echo "No placeholder values found"
```

Expected:

```text
No placeholder values found
```

### Task 3: Validate VPS Prerequisites

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\linux\setup-ufw.sh`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\linux\setup-fail2ban.sh`

- [ ] **Step 1: Confirm Docker and Compose are ready on the VPS**

Run:

```bash
docker --version
docker compose version
```

Expected:

```text
Both commands return installed version details.
```

- [ ] **Step 2: Confirm the current production stack is visible**

Run:

```bash
cd /opt/tuckinn-platform/platform
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml ps
```

Expected:

```text
You see caddy, postgres, redis, api, storefront, admin, and staff.
```

- [ ] **Step 3: Confirm firewall posture before the release**

Run:

```bash
sudo ufw status
ss -tulpn
```

Expected:

```text
Only intended public ports are exposed, typically 22, 80, and 443.
```

### Task 4: Capture A Rollback Point

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\backup-postgres.sh`
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\restore-postgres.sh`

- [ ] **Step 1: Record the currently deployed Git revision on the VPS**

Run:

```bash
cd /opt/tuckinn-platform
git rev-parse HEAD | tee /tmp/tuckinn-predeploy-sha.txt
```

Expected:

```text
The previous release SHA is saved to /tmp/tuckinn-predeploy-sha.txt.
```

- [ ] **Step 2: Create a PostgreSQL backup before touching the release**

Run:

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/docker/backup-postgres.sh
BACKUP_DIR=/var/backups/tuckinn ./infra/docker/backup-postgres.sh
```

Expected:

```text
A timestamped .sql.gz backup is created successfully.
```

- [ ] **Step 3: Verify the backup file exists and is readable**

Run:

```bash
ls -lah /var/backups/tuckinn
gzip -t "$(ls -1t /var/backups/tuckinn/*.sql.gz | head -n 1)"
```

Expected:

```text
The newest backup file is present and passes gzip integrity check.
```

### Task 5: Add Or Tighten Deployment Automation

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\deploy-vps.sh`
- Create: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\.github\workflows\vps-deploy.yml`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`

- [ ] **Step 1: Update the VPS deploy script to enforce preconditions**

Target behavior:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PLATFORM_ROOT}"

test -f ".env.production"
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml build
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml up -d
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml exec -T api pnpm db:migrate:deploy
```

- [ ] **Step 2: Add a GitHub Actions workflow that SSHes to the VPS and runs the same release path**

Target workflow shape:

```yaml
name: VPS Deploy
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            set -euo pipefail
            cd /opt/tuckinn-platform
            git fetch --all
            git checkout main
            git pull --ff-only
            cd /opt/tuckinn-platform/platform
            ./infra/docker/deploy-vps.sh
```

- [ ] **Step 3: Document that seeding is first-deploy only**

Add this rule to the deployment docs:

```text
Run the seed container only on first deploy or deliberate reseed operations.
Do not reseed during routine upgrades.
```

### Task 6: Define The Maintenance Window Procedure

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\launch-hardening.md`

- [ ] **Step 1: Add the release operator checklist**

Checklist content:

```text
1. Announce maintenance window.
2. Confirm backup completed.
3. Confirm predeploy SHA captured.
4. Confirm production env audited.
5. Pull target revision.
6. Run deploy script.
7. Run migrations.
8. Run smoke tests.
9. Reopen traffic only if all checks pass.
10. If any critical check fails, execute rollback.
```

- [ ] **Step 2: Define what “maintenance window” means operationally**

Document:

```text
The maintenance window is a short scheduled period where users may see temporary errors or degraded service while containers are rebuilt and restarted.
Do not advertise the system as fully available until smoke checks are complete.
```

### Task 7: Execute The VPS Upgrade

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\deploy-vps.sh`

- [ ] **Step 1: Pull the release candidate on the VPS**

Run:

```bash
cd /opt/tuckinn-platform
git fetch --all
git checkout <release-sha-or-branch>
git pull --ff-only || true
```

Expected:

```text
The VPS working tree matches the intended release candidate.
```

- [ ] **Step 2: Start the controlled upgrade**

Run:

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/docker/deploy-vps.sh
./infra/docker/deploy-vps.sh
```

Expected:

```text
Docker images build successfully and the stack comes up.
```

- [ ] **Step 3: Run Prisma production migrations explicitly**

Run:

```bash
cd /opt/tuckinn-platform/platform
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml exec -T api pnpm db:migrate:deploy
```

Expected:

```text
Prisma reports that production migrations were applied or that no pending migrations remain.
```

- [ ] **Step 4: Confirm container health after restart**

Run:

```bash
cd /opt/tuckinn-platform/platform
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml ps
```

Expected:

```text
All required services are running and healthy.
```

### Task 8: Smoke Test Every Public Surface

**Files:**
- Review: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\infra\docker\Caddyfile`

- [ ] **Step 1: Check API health**

Run:

```bash
curl -fsS https://api.tuckinn.com/api/health
```

Expected:

```text
Healthy JSON response.
```

- [ ] **Step 2: Check storefront**

Run:

```bash
curl -I https://tuckinn.com
```

Expected:

```text
HTTP 200 or 3xx to the correct canonical storefront URL.
```

- [ ] **Step 3: Check admin**

Run:

```bash
curl -I https://admin.tuckinn.com
```

Expected:

```text
HTTP 200 or 3xx to the correct admin URL.
```

- [ ] **Step 4: Check staff**

Run:

```bash
curl -I https://staff.tuckinn.com
```

Expected:

```text
HTTP 200 or 3xx to the correct staff URL.
```

- [ ] **Step 5: Check API domain routing through Caddy**

Run:

```bash
curl -I https://api.tuckinn.com
```

Expected:

```text
Valid HTTPS response from the edge proxy without TLS or routing errors.
```

- [ ] **Step 6: Check authenticated staff workflow manually**

Manual check:

```text
Log in to staff.tuckinn.com with the production staff/admin account.
Confirm the board loads and order status actions are visible.
```

- [ ] **Step 7: Check authenticated admin workflow manually**

Manual check:

```text
Log in to admin.tuckinn.com.
Confirm catalog and modifier screens load without API/auth errors.
```

### Task 9: Define And Test Rollback Commands

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\launch-hardening.md`

- [ ] **Step 1: Add the application rollback commands to docs**

Rollback commands:

```bash
cd /opt/tuckinn-platform
git checkout "$(cat /tmp/tuckinn-predeploy-sha.txt)"
cd /opt/tuckinn-platform/platform
./infra/docker/deploy-vps.sh
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml ps
curl -fsS https://api.tuckinn.com/api/health
```

- [ ] **Step 2: Add the database restore command for migration failure scenarios**

Restore command:

```bash
cd /opt/tuckinn-platform/platform
./infra/docker/restore-postgres.sh /absolute/path/to/backup.sql.gz
```

- [ ] **Step 3: Document the rollback decision rule**

Rule:

```text
If app containers fail or smoke checks fail without data corruption, roll back the application revision first.
Only restore the database if a migration or data integrity issue requires it.
```

### Task 10: Close The Upgrade And Record The State

**Files:**
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\docs\operations\vps-deployment.md`
- Modify: `C:\Users\steph\OneDrive\Desktop\tuckinn p new\PROJECT_PROGRESS.md`

- [ ] **Step 1: Record the deployed revision and deployment time**

Run:

```bash
cd /opt/tuckinn-platform
git rev-parse HEAD
date -u
```

Expected:

```text
You have the live deployed SHA and UTC deployment timestamp.
```

- [ ] **Step 2: Record the production release result**

Template:

```text
Release SHA:
Deployment time UTC:
Backup file:
Migration result:
Smoke test result:
Rollback needed: no
```

- [ ] **Step 3: Rotate the seeded admin password if this is first production deploy**

Rule:

```text
The seeded admin password must not remain the long-term production credential.
```

---

## Self-Review

- Spec coverage: this plan covers release freeze, env audit, VPS prerequisites, backup, deploy automation, maintenance window procedure, deployment execution, smoke tests, rollback, and release recording.
- Placeholder scan: no `TODO`, `TBD`, or “handle appropriately” placeholders remain.
- Type consistency: paths, domains, service names, and commands match the current repo layout and Compose topology.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-09-vps-clean-upgrade.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

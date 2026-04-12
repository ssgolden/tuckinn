# Tuckinn Project Progress

Last updated: 2026-04-08

## Current State

The project now exists in two layers:

1. Legacy prototype in the project root
2. Production platform in `platform/`

The production platform is the active long-term stack. It includes:

- `storefront` app
- `admin` app
- `staff` app
- `api` backend
- PostgreSQL with Prisma
- Redis
- Docker-based local and VPS deployment
- Caddy reverse proxy

## Frontend Progress

### Legacy Root App

The original website in the root folder was reviewed and improved earlier for:

- stronger UI structure
- restored menus and submenu behavior
- improved sandwich builder flow
- backend hardening on the legacy server
- staff UI fixes

Key root files touched during that work:

- `index.html`
- `style.css`
- `app.js`
- `staff.html`
- `staff.css`
- `staff.js`
- `server_sqljs.js`
- `admin-qr.html`

### New Storefront Platform

The new production storefront is in:

- `platform/apps/storefront`

Completed:

- live catalog-driven storefront
- cart integration with backend
- sandwich builder support via modifiers
- cleaned storefront layout
- dedicated public review hub at `/review`

Important storefront routes:

- `/`
- `/review`

## Backend Progress

The new production backend is in:

- `platform/apps/api`

Completed backend modules:

- auth and RBAC
- customer registration and login
- staff/admin login
- refresh token flow
- catalog management
- modifier groups and options
- cart persistence
- checkout orchestration
- payment model and local mock payments
- Stripe-ready payment structure
- webhook handling
- order retrieval APIs
- fulfillment board and status transitions
- realtime websocket updates

Database and schema work:

- Prisma schema created
- initial migration created
- seed pipeline created
- seeded admin user created

## Admin and Staff Apps

Admin app:

- `platform/apps/admin`

Staff app:

- `platform/apps/staff`

Completed:

- live API wiring
- auth token handling
- session restore and logout
- admin catalog and modifier create flows
- staff fulfillment board
- realtime staff updates

## Deployment Progress

Production deployment files were created in:

- `platform/infra/docker`
- `platform/infra/linux`
- `platform/docs/operations`

Completed:

- production Dockerfiles
- production Docker Compose stack
- Caddy reverse proxy config
- VPS deploy script
- backup and restore scripts
- UFW setup
- fail2ban setup
- GitHub Actions deploy workflow

## VPS Status

VPS host:

- `72.61.98.49`
- `srv1330234.hstgr.cloud`

Live review URLs:

- Storefront: `https://72.61.98.49.sslip.io`
- Review hub: `https://72.61.98.49.sslip.io/review`
- Admin: `https://admin.72.61.98.49.sslip.io`
- Staff: `https://staff.72.61.98.49.sslip.io`
- API: `https://api.72.61.98.49.sslip.io/api`
- API health: `https://api.72.61.98.49.sslip.io/api/health`

Verified on VPS:

- Docker installed
- production stack deployed
- HTTPS active through Caddy
- Postgres healthy
- Redis healthy
- API healthy
- storefront healthy
- admin healthy
- staff healthy
- admin login verified

## Security and Credential Work

Completed:

- rotated app-side secrets on VPS
- rotated seeded admin password
- revoked active auth sessions
- verified old admin password fails
- verified new admin password works

Important note:

- GitHub token previously used during deployment should be rotated outside this repo
- VPS root SSH access should be moved to key-only auth in the next hardening pass

## Local Backup and Packaging

Fresh local backup created:

- `backup_20260407_204737`

Fresh deployment-only package created:

- `deployment_package_20260407_204901`

These live in the project root:

- `C:\Users\steph\OneDrive\Desktop\tuckinn p new`

## Key Commits Pushed

Recent production/deployment commits pushed to `main` include:

- `7bbbf38` Add production platform workspace and VPS deployment stack
- `33930d2` Add empty public directories for admin and staff builds
- `94435db` Fix production seed container command
- `abf7272` Fix production seed runtime dependencies
- `2d5b8df` Fix API production image workspace dependencies
- `12a7cc3` Fix production Next container host binding
- `e498aaf` Add storefront review hub page

## What Is Still Not Final

The system is deployed and reviewable, but these items remain before final public launch:

- replace `sslip.io` with real domains
- rotate GitHub token
- move SSH to key-only auth
- disable root password login
- optionally add extra protection for admin/staff such as allowlisting or extra auth
- switch Stripe from test mode to live mode when ready

## Recommended Next Steps

1. Bind real domains to storefront, admin, staff, and API
2. Move VPS SSH to key-only auth and disable password-based root login
3. Switch Stripe to live mode (replace `sk_test_`/`pk_test_` with `sk_live_`/`pk_live_`)
4. Add final launch smoke tests and rollback checklist

## 2026-04-08 — VPS Migration + Stripe Checkout

Deployed to new VPS at `187.124.217.8`:

- Installed Docker + Docker Compose on fresh Ubuntu 24.04 VPS
- Built and deployed full production stack (API, storefront, admin, staff, Postgres, Redis, Caddy)
- Stopped LiteSpeed (was occupying ports 80/443)
- Added SSH key auth for the VPS

Stripe Checkout integration:

- Replaced mock payments with Stripe Checkout Sessions
- Added `createCheckoutSession` method to PaymentsService
- Added `checkout.session.completed` and `checkout.session.expired` webhook handlers
- Storefront redirects to Stripe hosted checkout page on "Proceed to Payment"
- Apple Pay and Google Pay appear automatically in Stripe Checkout (card + link payment methods)
- Success/cancel redirect handling added to storefront
- Webhook endpoint: `POST /api/webhooks/stripe`

Production URLs:

- Storefront: `https://187.124.217.8.sslip.io`
- Admin: `https://admin.187.124.217.8.sslip.io`
- Staff: `https://staff.187.124.217.8.sslip.io`
- API: `https://api.187.124.217.8.sslip.io/api`

Backups created at `backup/20260408_234753/` in both project directories.

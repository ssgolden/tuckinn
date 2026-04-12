# Runtime Integration

## Current machine state

- `docker`: not installed
- `psql`: not installed
- `redis-server`: not installed

This means the platform cannot be fully runtime-tested on this machine yet because the API depends on PostgreSQL and Redis.

## Frontend environment

Create local frontend env files from these templates:

```powershell
Copy-Item apps\\staff\\.env.local.example apps\\staff\\.env.local
Copy-Item apps\\admin\\.env.local.example apps\\admin\\.env.local
Copy-Item apps\\storefront\\.env.local.example apps\\storefront\\.env.local
```

Default value:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3200/api
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3101
NEXT_PUBLIC_STAFF_APP_URL=http://localhost:3102
```

## What is ready now

- Staff UI is wired to:
  - `POST /api/auth/staff/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/fulfillment/board`
  - `PATCH /api/fulfillment/orders/:orderId/status`
- Admin UI is wired to:
  - `POST /api/auth/staff/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET /api/catalog/categories`
  - `GET /api/catalog/products`
  - `GET /api/modifiers/groups`
  - `POST /api/catalog/categories`
  - `POST /api/catalog/products`
  - `POST /api/modifiers/groups`
  - `POST /api/modifiers/options`
  - `POST /api/modifiers/attach`
- Storefront UI is wired to:
  - `GET /api/catalog/public`
  - `POST /api/carts`
  - `GET /api/carts/:cartId`
  - `POST /api/carts/:cartId/items`
  - `DELETE /api/carts/:cartId/items/:itemId`
  - `POST /api/checkout/start`

## When local services are available

Run:

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
Copy-Item .env.example .env
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm --filter @tuckinn/api dev
pnpm --filter @tuckinn/staff dev
pnpm --filter @tuckinn/admin dev
pnpm --filter @tuckinn/storefront dev
```

If Docker becomes available, use:

```powershell
docker compose -f infra/docker/docker-compose.local.yml up -d
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## Local seeded admin

Set local-only seed credentials in `platform/.env.example` before first use, and rotate them before any shared or non-local environment.

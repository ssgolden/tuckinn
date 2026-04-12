# Target Monorepo Structure

## Goal

Move from a flat prototype project into a deployable monorepo with clear runtime boundaries.

## Proposed Layout

```text
tuckinn-platform/
  apps/
    storefront/
      app/
      components/
      lib/
      public/
      next.config.ts
      package.json
    admin/
      app/
      components/
      lib/
      package.json
    staff/
      app/
      components/
      lib/
      package.json
    api/
      src/
        main.ts
        app.module.ts
        common/
        config/
        prisma/
        auth/
        users/
        rbac/
        customers/
        catalog/
        modifiers/
        pricing/
        promotions/
        tables/
        carts/
        checkout/
        payments/
        orders/
        fulfillment/
        notifications/
        content/
        media/
        analytics/
        audit/
        webhooks/
      test/
      package.json
    mobile/
      app/
      src/
      package.json

  packages/
    ui/
      src/
      package.json
    types/
      src/
      package.json
    api-client/
      src/
      package.json
    config/
      eslint/
      typescript/
      tailwind/
      env/

  infra/
    docker/
      docker-compose.local.yml
    kubernetes/
    github-actions/
    terraform/

  prisma/
    schema.prisma
    migrations/
    seed.ts

  docs/
    phase-1/
    api/
    operations/

  .github/
    workflows/

  package.json
  turbo.json
  pnpm-workspace.yaml
  README.md
```

## App Responsibilities

### `apps/storefront`

Customer-facing commerce app.

Owns:

- menu browsing
- sandwich builder
- customer login and account
- basket and checkout
- payment confirmation
- order tracking
- content pages and promotions

### `apps/admin`

Back-office commerce management.

Owns:

- products and categories
- modifier groups and option pricing
- promotions and discount rules
- content blocks and banners
- table and QR setup
- customer lookup
- reporting
- audit visibility

### `apps/staff`

Kitchen and front-of-house operations.

Owns:

- live order queue
- status progression
- prep timers
- order detail drill-down
- collection and dine-in workflow

### `apps/api`

Central backend platform.

Owns:

- auth
- business logic
- database access
- payment orchestration
- admin APIs
- realtime events
- background jobs

## Package Responsibilities

### `packages/ui`

Shared components and tokens across web apps.

### `packages/types`

Shared DTOs, enums, and API contracts.

### `packages/api-client`

Typed fetch or SDK layer used by web and mobile clients.

### `packages/config`

Centralized config standards:

- TypeScript
- ESLint
- Tailwind
- environment validation

## API Module Map

### Auth and identity

- `auth`
- `users`
- `rbac`
- `customers`

### Commerce core

- `catalog`
- `modifiers`
- `pricing`
- `promotions`
- `carts`
- `checkout`
- `orders`
- `payments`

### Operations

- `tables`
- `fulfillment`
- `notifications`

### Platform and governance

- `content`
- `media`
- `analytics`
- `audit`
- `webhooks`

## Runtime Boundaries

### Web apps

Should never access the database directly.

### API

Only service allowed to mutate transactional data.

### Workers

Handle:

- webhook processing
- email and SMS sends
- payout or refund side effects
- delayed operational tasks

## Rollout Path From Current Project

1. preserve current branding assets and UX decisions
2. create monorepo scaffold beside the prototype
3. build API and schema first
4. move storefront flow onto typed APIs
5. retire the static Express prototype once parity is reached

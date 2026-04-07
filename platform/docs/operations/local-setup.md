# Local Setup

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop

## 1. Start infrastructure

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
docker compose -f infra/docker/docker-compose.local.yml up -d
```

## 2. Configure environment

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
Copy-Item .env.example .env
```

## 3. Install workspace dependencies

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
pnpm install
```

## 4. Generate Prisma client

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
pnpm db:generate
```

## 5. Start development apps

```powershell
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
pnpm dev
```

## Planned local ports

- storefront: `3100`
- admin: `3101`
- staff: `3102`
- api: `3200`
- postgres: `5432`
- redis: `6379`
- mailpit UI: `8025`

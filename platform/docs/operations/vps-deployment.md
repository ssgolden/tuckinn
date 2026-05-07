# Tuckinn VPS Deployment

## Target topology

- `tuckinn.com` -> storefront
- `admin.tuckinn.com` -> admin
- `staff.tuckinn.com` -> staff
- `api.tuckinn.com` -> API
- Caddy terminates HTTPS
- Docker Compose runs app and data services

## Required files

- `infra/docker/Dockerfile.api`
- `infra/docker/Dockerfile.next`
- `infra/docker/docker-compose.prod.yml`
- `infra/docker/Caddyfile`
- `.env.production`

## VPS prerequisites

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and back in after adding your user to the `docker` group.

## First deploy

```bash
cd /opt
git clone <your-repo-url> tuckinn-platform
cd /opt/tuckinn-platform/platform
cp .env.production.example .env.production
nano .env.production
chmod +x infra/docker/deploy-vps.sh
./infra/docker/deploy-vps.sh
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml run --rm seed
```

## DNS

Create A records pointing to your VPS IP:

- `tuckinn.com`
- `admin.tuckinn.com`
- `staff.tuckinn.com`
- `api.tuckinn.com`

## Update deploy

```bash
cd /opt/tuckinn-platform/platform
git pull
./infra/docker/deploy-vps.sh
```

## Production notes

- Set real Stripe live keys before launch.
- Change the seeded admin password immediately after first deploy.
- Back up the `postgres_data` volume before major updates.
- Move Postgres and Redis off-box later if traffic or risk profile increases.

## Re-seeding catalog data

When seed data changes (e.g. Meal Deal renames in `prisma/seed.ts`), re-run the
seed container against the live database. The seed is idempotent for upsertable
records; verify behaviour for your specific changes before running on prod.

```bash
cd /opt/tuckinn-platform/platform
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml run --rm seed
```

If the seed only inserts (does not upsert) for a given entity, prefer editing
through the admin UI at `https://admin.tuckinnproper.com` instead of re-seeding,
to avoid duplicates.

## SSH hardening (do once after first deploy)

The VPS still allows root password login. Lock it down to key-only auth before
public launch.

1. From your local machine, copy your public key to the VPS (replace IP):
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@187.124.217.8
   ```
2. SSH in and confirm key auth works without a password prompt:
   ```bash
   ssh root@187.124.217.8
   ```
3. Edit `/etc/ssh/sshd_config`:
   ```
   PermitRootLogin prohibit-password
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```
4. Validate config and reload:
   ```bash
   sshd -t && systemctl reload ssh
   ```
5. From a NEW terminal (keep the old session open as a fallback), confirm you
   can still log in via key. Only close the original session after verifying.

## Post-deploy launch checklist

After every production deploy, verify:

- `curl -I https://tuckinnproper.com` returns `Strict-Transport-Security` header
- `curl https://tuckinnproper.com/robots.txt` returns 200 with a `Sitemap:` line
- `curl https://tuckinnproper.com/sitemap.xml` returns 200 with `<urlset>` XML
- `curl -s https://api.tuckinnproper.com/api/health` returns
  `{"status":"ok","database":"connected"}`
- Place one real test order end-to-end (storefront → Stripe Checkout → webhook →
  order visible in `https://staff.tuckinnproper.com`)
- Confirm Stripe dashboard is in **Live** mode and the test order appears there
- View-source the homepage and confirm `og:title`, `twitter:card`, and the
  `application/ld+json` Restaurant schema are present

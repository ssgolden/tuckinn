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

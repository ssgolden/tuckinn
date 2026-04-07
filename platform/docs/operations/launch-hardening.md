# Tuckinn Launch Hardening

## What was added

- Docker log limits in production Compose
- Container healthchecks for API and Next apps
- PostgreSQL backup script
- PostgreSQL restore script
- UFW setup script
- Fail2ban SSH jail setup script
- GitHub Actions VPS deploy workflow

## Backup

Run a manual backup:

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/docker/backup-postgres.sh
./infra/docker/backup-postgres.sh
```

Optional retention tuning:

```bash
BACKUP_DIR=/var/backups/tuckinn RETENTION_DAYS=30 ./infra/docker/backup-postgres.sh
```

Restore:

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/docker/restore-postgres.sh
./infra/docker/restore-postgres.sh /absolute/path/to/backup.sql.gz
```

## Cron backup

Example nightly backup at 02:15:

```bash
crontab -e
```

```cron
15 2 * * * cd /opt/tuckinn-platform/platform && BACKUP_DIR=/var/backups/tuckinn ./infra/docker/backup-postgres.sh >> /var/log/tuckinn-backup.log 2>&1
```

## Firewall

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/linux/setup-ufw.sh
SSH_PORT=22 ./infra/linux/setup-ufw.sh
```

Open only:

- SSH
- HTTP
- HTTPS

## Fail2ban

```bash
cd /opt/tuckinn-platform/platform
chmod +x infra/linux/setup-fail2ban.sh
SSH_PORT=22 ./infra/linux/setup-fail2ban.sh
```

## GitHub Actions secrets

Add these repository secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT`

## Before public launch

- Replace all placeholder secrets in `.env.production`
- Use real Stripe live keys
- Change seeded admin password
- Test backup and restore once
- Confirm DNS and TLS are live
- Confirm only ports `22`, `80`, and `443` are reachable from the internet

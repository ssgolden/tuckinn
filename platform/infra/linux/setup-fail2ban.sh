#!/usr/bin/env bash
set -euo pipefail

SSH_PORT="${SSH_PORT:-22}"
JAIL_LOCAL_PATH="/etc/fail2ban/jail.d/tuckinn-sshd.local"

sudo apt update
sudo apt install -y fail2ban

sudo tee "${JAIL_LOCAL_PATH}" > /dev/null <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
logpath = %(sshd_log)s
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd

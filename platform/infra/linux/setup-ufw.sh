#!/usr/bin/env bash
set -euo pipefail

SSH_PORT="${SSH_PORT:-22}"

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow "${SSH_PORT}/tcp"
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose

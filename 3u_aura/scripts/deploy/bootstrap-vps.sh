#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: bootstrap-vps.sh [--app-user USER] [--app-group GROUP] [--help]

Initialize an Ubuntu VPS for 3U AURA deployment:
- install base packages
- create app user/group
- create standard directories
EOF
}

APP_USER="3u-aura"
APP_GROUP="3u-aura"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --app-group)
      APP_GROUP="$2"
      shift 2
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

sudo apt-get update
sudo apt-get install -y curl git unzip nginx certbot python3-certbot-nginx build-essential

if ! getent group "${APP_GROUP}" >/dev/null; then
  sudo groupadd "${APP_GROUP}"
fi

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  sudo useradd --system --create-home --gid "${APP_GROUP}" --shell /bin/bash "${APP_USER}"
fi

sudo mkdir -p /opt/3u-aura/current /opt/3u-aura/shared /etc/3u-aura /var/log/3u-aura
sudo chown -R "${APP_USER}:${APP_GROUP}" /opt/3u-aura /var/log/3u-aura

echo "bootstrap complete"

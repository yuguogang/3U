#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: install-docker-stack.sh [--infra-env FILE] [--compose FILE] [--help]

Install Docker Engine + Compose plugin on Ubuntu and start the
Postgres/Redis stack for testnet-mockusdt.
EOF
}

INFRA_ENV="/etc/3u-aura/testnet-mockusdt/infra.env"
COMPOSE_FILE="ops/docker/testnet-mockusdt.compose.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --infra-env)
      INFRA_ENV="$2"
      shift 2
      ;;
    --compose)
      COMPOSE_FILE="$2"
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
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if [[ ! -f "${INFRA_ENV}" ]]; then
  echo "Missing infra env file: ${INFRA_ENV}" >&2
  exit 1
fi

sudo docker compose --env-file "${INFRA_ENV}" -f "${COMPOSE_FILE}" up -d
echo "docker infra started"

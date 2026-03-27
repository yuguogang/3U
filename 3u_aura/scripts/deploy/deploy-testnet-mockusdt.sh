#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: deploy-testnet-mockusdt.sh [--env NAME] [--app-root PATH] [--env-dir PATH] [--app-user USER] [--app-group GROUP] [--log-dir PATH] [--help]

Build and deploy 3U AURA server/dapp/admin on the current machine using
promotion-env derived env files and systemd service templates.
EOF
}

ENV_NAME="testnet-mockusdt"
APP_ROOT="$(pwd)"
ENV_DIR="/etc/3u-aura/testnet-mockusdt"
APP_USER="3u-aura"
APP_GROUP="3u-aura"
LOG_DIR="/var/log/3u-aura"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="$2"
      shift 2
      ;;
    --app-root)
      APP_ROOT="$2"
      shift 2
      ;;
    --env-dir)
      ENV_DIR="$2"
      shift 2
      ;;
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --app-group)
      APP_GROUP="$2"
      shift 2
      ;;
    --log-dir)
      LOG_DIR="$2"
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

mkdir -p "${ENV_DIR}"

node scripts/promotion-env/sync-public-envs.mjs
node scripts/promotion-env/print-env.mjs --env "${ENV_NAME}" --target server > "${ENV_DIR}/server.env"
node scripts/promotion-env/print-env.mjs --env "${ENV_NAME}" --target dapp > "${ENV_DIR}/dapp.env"
node scripts/promotion-env/print-env.mjs --env "${ENV_NAME}" --target admin > "${ENV_DIR}/admin.env"

INFRA_ENV="${ENV_DIR}/infra.env"
if [[ -f "${INFRA_ENV}" ]]; then
  REDIS_PASSWORD="$(
    awk -F '=' '/^REDIS_PASSWORD=/{sub(/^[^=]*=/, "", $0); print $0}' "${INFRA_ENV}" | tail -n 1
  )"
  if [[ -n "${REDIS_PASSWORD}" ]]; then
    cat >> "${ENV_DIR}/server.env" <<EOF
CACHE_PASSWORD=${REDIS_PASSWORD}
BULL_PASSWORD=${REDIS_PASSWORD}
THROTTLER_PASSWORD=${REDIS_PASSWORD}
EOF
  fi
fi

pnpm install --frozen-lockfile
pnpm --dir packages/common build
PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/server env:db:generate
pnpm --dir apps/server build
PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/dapp env:build
PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/admin env:build

sudo chown -R "${APP_USER}:${APP_GROUP}" \
  "${APP_ROOT}/apps/server/dist" \
  "${APP_ROOT}/apps/server/generated" \
  "${APP_ROOT}/apps/dapp/.next" \
  "${APP_ROOT}/apps/admin/.next" \
  "${APP_ROOT}/packages/common/dist"

render_unit() {
  local template="$1"
  local output="$2"
  sed \
    -e "s|__ENV_NAME__|${ENV_NAME}|g" \
    -e "s|__APP_USER__|${APP_USER}|g" \
    -e "s|__APP_GROUP__|${APP_GROUP}|g" \
    -e "s|__APP_ROOT__|${APP_ROOT}|g" \
    -e "s|__ENV_DIR__|${ENV_DIR}|g" \
    -e "s|__LOG_DIR__|${LOG_DIR}|g" \
    "${template}" > "${output}"
}

TMP_DIR="$(mktemp -d)"
render_unit "ops/systemd/3u-aura-server.service.template" "${TMP_DIR}/3u-aura-server.service"
render_unit "ops/systemd/3u-aura-dapp.service.template" "${TMP_DIR}/3u-aura-dapp.service"
render_unit "ops/systemd/3u-aura-admin.service.template" "${TMP_DIR}/3u-aura-admin.service"

sudo cp "${TMP_DIR}/3u-aura-server.service" /etc/systemd/system/3u-aura-server.service
sudo cp "${TMP_DIR}/3u-aura-dapp.service" /etc/systemd/system/3u-aura-dapp.service
sudo cp "${TMP_DIR}/3u-aura-admin.service" /etc/systemd/system/3u-aura-admin.service
sudo systemctl daemon-reload
sudo systemctl enable 3u-aura-server 3u-aura-dapp 3u-aura-admin
sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin

echo "deploy complete"

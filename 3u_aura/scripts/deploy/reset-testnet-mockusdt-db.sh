#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: reset-testnet-mockusdt-db.sh [--env NAME] [--app-root PATH] [--env-dir PATH] [--skip-restart] --confirm reset-testnet-mockusdt

Dangerous operation for disposable testnet environments only.
This script drops the target schema, reapplies the baseline schema,
runs Prisma migrations, seeds the database, and optionally restarts services.
EOF
}

ENV_NAME="testnet-mockusdt"
APP_ROOT="$(pwd)"
ENV_DIR="/etc/3u-aura/testnet-mockusdt"
SKIP_RESTART="false"
CONFIRM_VALUE=""

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
    --skip-restart)
      SKIP_RESTART="true"
      shift 1
      ;;
    --confirm)
      CONFIRM_VALUE="$2"
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

if [[ "${CONFIRM_VALUE}" != "reset-testnet-mockusdt" ]]; then
  echo "Refusing to reset database without: --confirm reset-testnet-mockusdt" >&2
  exit 1
fi

cd "${APP_ROOT}"

set -a
source "${ENV_DIR}/shared.env"
source "${ENV_DIR}/server.env"
set +a

POSTGRES_CONTAINER="3u-aura-${ENV_NAME}-postgres"
BASELINE_MIGRATION="20260311_schema_model_alignment_hardening"
TARGET_SCHEMA="${DATABASE_SCHEMA:-public}"

run_prisma() {
  node scripts/promotion-env/run-with-env.mjs --target server -- \
    pnpm --dir apps/server exec prisma "$@"
}

align_postgres_password() {
  docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${DATABASE_USER}" -d postgres \
    -c "ALTER USER ${DATABASE_USER} WITH PASSWORD '${DATABASE_PASSWORD}';" >/dev/null
}

reset_schema() {
  docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${DATABASE_USER}" -d "${DATABASE_NAME}" \
    -c "DROP SCHEMA IF EXISTS \"${TARGET_SCHEMA}\" CASCADE; CREATE SCHEMA \"${TARGET_SCHEMA}\";" >/dev/null
}

align_postgres_password
reset_schema

PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/server env:db:generate

run_prisma db execute --file "prisma/migrations/${BASELINE_MIGRATION}/migration.sql"
run_prisma migrate resolve --applied "${BASELINE_MIGRATION}"

PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/server env:db:migrate deploy
PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/server env:db:seed

if [[ "${SKIP_RESTART}" != "true" ]]; then
  sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
fi

echo "database reset complete"

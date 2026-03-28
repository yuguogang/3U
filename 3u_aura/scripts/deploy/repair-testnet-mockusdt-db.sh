#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: repair-testnet-mockusdt-db.sh [--env NAME] [--app-root PATH] [--env-dir PATH] [--skip-restart] [--help]

Repair and migrate the testnet-mockusdt Postgres schema in one step.
This script aligns the Postgres password, repairs the known failed phase2
baseline state, applies the schema baseline when needed, runs Prisma migrations,
and optionally restarts app services.
EOF
}

ENV_NAME="testnet-mockusdt"
APP_ROOT="$(pwd)"
ENV_DIR="/etc/3u-aura/testnet-mockusdt"
SKIP_RESTART="false"

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

cd "${APP_ROOT}"

set -a
source "${ENV_DIR}/shared.env"
source "${ENV_DIR}/server.env"
set +a

POSTGRES_CONTAINER="3u-aura-${ENV_NAME}-postgres"
PHASE2_MIGRATION="20260311_phase2_checkin_pool_split_fact"
BASELINE_MIGRATION="20260311_schema_model_alignment_hardening"

run_prisma() {
  node scripts/promotion-env/run-with-env.mjs --target server -- \
    pnpm --dir apps/server exec prisma "$@"
}

run_migrate_deploy() {
  PROMOTION_ENV="${ENV_NAME}" pnpm --dir apps/server env:db:migrate deploy
}

psql_query() {
  local sql="$1"
  docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${DATABASE_USER}" -d "${DATABASE_NAME}" -tAc "${sql}"
}

align_postgres_password() {
  docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${DATABASE_USER}" -d postgres \
    -c "ALTER USER ${DATABASE_USER} WITH PASSWORD '${DATABASE_PASSWORD}';" >/dev/null
}

table_exists() {
  local table_name="$1"
  local exists
  exists="$(psql_query "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table_name}');")"
  [[ "${exists}" == "t" ]]
}

migration_applied() {
  local migration_name="$1"
  local applied
  applied="$(psql_query "SELECT EXISTS (SELECT 1 FROM \"_prisma_migrations\" WHERE migration_name = '${migration_name}' AND finished_at IS NOT NULL AND rolled_back_at IS NULL);")"
  [[ "${applied}" == "t" ]]
}

attempt_migrate() {
  local output_file="$1"
  if run_migrate_deploy >"${output_file}" 2>&1; then
    cat "${output_file}"
    return 0
  fi

  cat "${output_file}" >&2
  return 1
}

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "${TMP_OUTPUT}"' EXIT

align_postgres_password

if attempt_migrate "${TMP_OUTPUT}"; then
  if [[ "${SKIP_RESTART}" != "true" ]]; then
    sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
  fi
  echo "database repair complete"
  exit 0
fi

if grep -q "P3009" "${TMP_OUTPUT}" || grep -q "${PHASE2_MIGRATION}" "${TMP_OUTPUT}" || grep -q 'relation "User" does not exist' "${TMP_OUTPUT}"; then
  docker exec "${POSTGRES_CONTAINER}" \
    psql -U "${DATABASE_USER}" -d "${DATABASE_NAME}" \
    -c 'DROP TABLE IF EXISTS "PoolSplitFact" CASCADE;' >/dev/null

  run_prisma migrate resolve --rolled-back "${PHASE2_MIGRATION}"

  if ! table_exists "User"; then
    run_prisma db execute --file "prisma/migrations/${BASELINE_MIGRATION}/migration.sql"
  fi

  if ! migration_applied "${BASELINE_MIGRATION}"; then
    run_prisma migrate resolve --applied "${BASELINE_MIGRATION}"
  fi

  if attempt_migrate "${TMP_OUTPUT}"; then
    if [[ "${SKIP_RESTART}" != "true" ]]; then
      sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
    fi
    echo "database repair complete"
    exit 0
  fi
fi

echo "database repair failed; see output above" >&2
exit 1

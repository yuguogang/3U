#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Usage: smoke-test-testnet-mockusdt.sh [--api URL] [--app URL] [--admin URL]
EOF
}

API_URL="http://127.0.0.1:3110"
APP_URL="http://127.0.0.1:3100"
ADMIN_URL="http://127.0.0.1:3101"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api)
      API_URL="$2"
      shift 2
      ;;
    --app)
      APP_URL="$2"
      shift 2
      ;;
    --admin)
      ADMIN_URL="$2"
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

curl -fsS "${API_URL}/api/v1/health"
curl -fsSI "${APP_URL}"
curl -fsSI "${ADMIN_URL}/dashboard"
echo "smoke passed"

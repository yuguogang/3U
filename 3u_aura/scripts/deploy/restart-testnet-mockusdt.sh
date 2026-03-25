#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: restart-testnet-mockusdt.sh"
  exit 0
fi

sudo systemctl restart 3u-aura-server 3u-aura-dapp 3u-aura-admin
sudo systemctl --no-pager --full status 3u-aura-server 3u-aura-dapp 3u-aura-admin

# Testnet MockUSDT Rollback Runbook

## When To Roll Back

Use rollback if:

- contracts were deployed but app envs were not updated correctly
- VPS build/start succeeds but runtime is unhealthy
- Nginx/domain cutover breaks dapp/admin/api
- manual UAT fails on critical payment or claim flows

## Safe Rollback Order

1. Stop public cutover
2. Restore old Nginx site
3. Restart old systemd units if they still exist
4. Restore previous env files
5. Keep new manifest and broadcast artifacts for audit

## Server Rollback

```bash
sudo systemctl stop 3u-aura-server 3u-aura-dapp 3u-aura-admin
```

If using release symlinks, point `current` back to the previous release and restart:

```bash
bash scripts/deploy/restart-testnet-mockusdt.sh
```

## Infra Rollback

Do not destroy Postgres/Redis volumes unless explicitly intended.

Check running containers:

```bash
docker compose -f ops/docker/testnet-mockusdt.compose.yml ps
```

## Chain Rollback Notes

Fresh testnet contract deployments are not reverted on-chain.

Instead:

- mark failed addresses as abandoned
- keep broadcast artifacts
- deploy a new clean environment or update manifest to the correct deployment set

## Required Backups

Before cutover, keep copies of:

- previous manifest
- previous server/dapp/admin env files
- previous Nginx site config
- previous systemd units
- previous release directory

# Testnet MockUSDT Rollout — Execution Log

## Status

- Planning created
- Awaiting approval

## Plan Reference

- Plan: `docs/plan-excution/testnet-mockusdt-rollout/plan.md`

## Research Summary

- `testnet-live` 当前使用 `paymentTokenKind = live-test-token`
- `uat-mockusdt` 已经提供了完整的 mock token 参考环境
- `promotion-env` 脚本原生支持 `mockusdt` 类型环境
- `NFTSale` / `Settlement` / `MerkleClaim` 在部署时绑定 `USDT_ADDRESS`
- 如果目标是测试服务器独立环境，推荐新发整套合约，不建议与 `uat-mockusdt` 共享链上地址

## Commands Run During Planning

- `rg -n "mockusdt|USDT|PAYMENT_TOKEN|payment token|MockUSDT|mock usdt|ERC20" apps config packages scripts -S`
- `sed -n '1,220p' config/promotion-envs/testnet-live/manifest.json`
- `sed -n '1,220p' config/promotion-envs/uat-mockusdt/manifest.json`
- `sed -n '1,260p' scripts/promotion-env/deploy-contract-suite.mjs`
- `sed -n '1,220p' apps/contracts/script/DeployNFTCore.s.sol`
- `sed -n '1,260p' apps/contracts/script/DeploySettlementClaim.s.sol`
- `sed -n '1,260p' apps/contracts/src/NFTSale.sol`
- `sed -n '1,220p' apps/contracts/src/Settlement.sol`
- `sed -n '1,200p' apps/contracts/src/mocks/MockUSDT.sol`
- `sed -n '1,220p' scripts/promotion-env/sync-public-envs.mjs`
- `sed -n '1,260p' scripts/uat/start-promotion-services.mjs`

## Preliminary Decision

- Recommendation:
  - create a new parallel environment, tentatively `testnet-mockusdt`
  - deploy a fresh MockUSDT-based full contract suite
- Non-recommended shortcut:
  - repoint a server to the existing `uat-mockusdt` chain addresses
  - this avoids new deployment, but shares on-chain state and weakens environment isolation


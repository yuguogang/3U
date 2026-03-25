# Reward Flow Hardening And Reward Funder Execution

## Status

- Created: 2026-03-25
- State: Draft plan created, awaiting approval

## Notes

- 本任务用于收口本轮 `fork-anvil` 测试暴露的奖励链路异常，并规划下一次迭代的 `rewardFunder / financeWallet` 中期方案。
- 当前阶段仅整理计划，不进入实现。

## Known Findings Captured For Follow-Up

1. `ClaimRecord/WeeklyReward` 可以先于链上 `depositRewards + publishRoot` 进入 `CLAIMABLE`，导致 UI 与链上真实可领状态错位。
2. `fork-anvil` 的 `config/promotion-envs` 与 `scripts/ci/.runtime` 存在地址漂移风险。
3. `sync-purchased-nft-state.ts` 作为 UAT 脚本过度依赖 `AppModule`，在脚本执行环境下稳定性不足。
4. 中期希望将 `MerkleDistributor` 注资语义从“owner 自带资金”升级为“受控从 financeWallet/rewardFunder 出资”。

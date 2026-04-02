# Business Rules 3, 4, 13, 14, 15 Execution

## Status

- Created: 2026-04-02
- State: Pending plan approval

## Notes

- 本任务只覆盖 `3 / 4 / 13 / 14 / 15`
- 本轮仅完成只读研究与计划编写，尚未进入实现

## Initial Findings

1. `3` 当前允许多次签到，但抽奖资格仍按 `streakDays >= 7` 和 `ticketCount = 0/1` 工作。
2. `4` 当前购买型卡牌上限由链上 `FounderNFT.MAX_PURCHASED_SUPPLY = 30` 控制，DApp 也显示 `/ 30`。
3. `13` 当前后端已计算间推 `5%`，缺口主要在前端文案。
4. `14` 当前数据库已有左右区/小区业绩，但 admin 没有“团队长总业绩”专用视图。
5. `15` 当前只有 `Referral NFT` 审批 -> 签名 -> 用户 mint 路径，没有 gift 路径。
6. `15` 的单钱包单 `REFERRAL` 规则当前由链上 `FounderNFT.hasReferralNFT` 保证。

## Commands Run During Planning

```bash
rg -n "checkin|lottery|ticket|streak|participantCount|ticketCount|5%|indirect|maxSupply|approval|smallLegVolume|leftTeamVolume|rightTeamVolume" apps packages scripts config -g '!**/node_modules/**'
sed -n '1,260p' apps/server/src/modules/checkin/engines/checkin-policy.engine.ts
sed -n '1,320p' apps/server/src/modules/checkin/services/checkin-application.service.ts
sed -n '1,320p' apps/server/src/modules/lottery/services/lottery-ticket.service.ts
sed -n '1,320p' apps/server/src/modules/lottery/repositories/lottery-ticket.repository.ts
sed -n '430,560p' apps/server/prisma/schema.prisma
sed -n '1,320p' apps/server/src/modules/rewards/services/rewards.service.ts
sed -n '1,260p' apps/server/src/modules/rewards/engines/reward-allocation.engine.ts
sed -n '1,260p' apps/contracts/src/FounderNFT.sol
sed -n '1,260p' apps/contracts/src/NFTSale.sol
sed -n '1,260p' apps/server/src/modules/admin/admin-console.controller.ts
sed -n '1,260p' apps/server/src/modules/admin/repositories/admin-console.repository.ts
sed -n '1,260p' apps/server/src/modules/signing/services/signing.service.ts
rg -n "team-invite|10%|5%|daysUntilTicket|/ 30|Referral NFT|approve|smallLegVolume|leftTeamVolume|rightTeamVolume" apps/dapp apps/admin packages/common apps/server/src -g '!**/node_modules/**'
```

## Approval Needed

- Pending approval of [plan.md](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/business-rules-3-4-13-14-15/plan.md)

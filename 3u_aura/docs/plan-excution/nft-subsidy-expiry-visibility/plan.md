# NFT Subsidy Expiry Visibility

## 1. Objective
修复购买型 NFT 周补贴在 claim deadline 过期后仍显示为“可领取”的问题，避免用户继续发起必然失败的链上交易。

## 2. Scope
- `apps/server` 中 NFT 周补贴读取与同步逻辑
- `apps/dapp` 中 claims 页面、claims 汇总、底部 claims badge 的可领取判定
- `packages/common` 中如有必要的视图状态补充
- `fork-anvil` 手工 UAT 回归

## 3. Out of Scope
- 修改 `Settlement.sol` 的链上 claim deadline 语义
- 重写补贴生成规则
- 修改抽奖/排名奖 claimability 逻辑
- 修复签到成功态缺少 txHash 展示

## 4. Assumptions
- 过期的 NFT 周补贴不应继续显示“领取”按钮。
- 过期补贴应至少满足以下两点之一：
  - 后端不再将其作为 claimable 返回；
  - 前端明确显示为“已过期/不可领取”。
- 当前库中 `NftSubsidyClaim.status = PENDING` 可能同时包含“仍可领”和“已过期但未同步”的两种语义。

## 5. Architecture Impact
- 需要把 NFT 补贴的“链上是否已过期”作为读取口径的一部分，而不是仅依赖本地 `status` 字段。
- 需要统一 server 与 dapp 的 claimability 规则，避免后端返回和前端展示不一致。
- 若需要新增状态字段映射，应优先通过 shared view model 显式表达，而不是让前端自行猜测。

## 6. Milestones

### Milestone 1: 梳理过期判定与当前暴露路径
- Goal
  - 确认 NFT 补贴从 `NftSubsidyClaim` 到 `PromotionClaimsView` 的状态流转，并定位 claims 页和 badge 的误判点。
- Affected files/modules
  - `apps/server/src/modules/claims/services/claims-read.service.ts`
  - `apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts`
  - `apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/components/pages/claims/subsidy-claim-row.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- Implementation notes
  - 先确认现有 server 是否已具备过期 void 能力但未在读取层执行。
  - 复核 dapp 是否简单按 `status === "PENDING"` 当作“可领取”。
- Risks
  - 可能存在 server 已部分修过，但前端仍按旧枚举解释。
- Verification commands
  - `rg -n "NftSubsidyClaim|claimDeadline|PENDING|CLAIMABLE" apps/server/src apps/dapp/src packages/common`
- Expected outputs
  - 一份明确的过期判定链路和误判点说明。

### Milestone 2: Server 端修正过期补贴暴露口径
- Goal
  - 确保过期的 NFT 补贴不会继续作为可领取记录暴露给 dapp。
- Affected files/modules
  - `apps/server/src/modules/claims/services/claims-read.service.ts`
  - `apps/server/src/modules/claims/repositories/nft-subsidy-claim.repository.ts`
  - `apps/server/src/modules/claims/services/purchased-nft-sync.service.ts`
  - `apps/server/src/modules/claims/services/*.spec.ts`
  - `packages/common/src/models/promotion.ts`（如需）
- Implementation notes
  - 优先复用现有 `published-nft` 同步和过期 void 能力。
  - 如有必要，在 claims read 阶段增加“过期过滤/映射”。
  - 保证不会误隐藏仍在有效期内的 PENDING 补贴。
- Risks
  - 可能影响 claims summary、pending 计数、历史记录显示。
- Verification commands
  - `pnpm --dir apps/server test -- claims-read.service.spec.ts purchased-nft-sync.service.spec.ts`
  - `pnpm --dir apps/server build`
- Expected outputs
  - 过期补贴不再被 server 暴露为 claimable。

### Milestone 3: DApp 端修正展示与计数
- Goal
  - claims 页面、汇总卡片和底部 badge 与 server 的新口径保持一致。
- Affected files/modules
  - `apps/dapp/src/components/pages/claims-page.tsx`
  - `apps/dapp/src/components/pages/claims/subsidy-claim-row.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`（如需补 claimable 数口径）
- Implementation notes
  - 若 server 仍返回过期记录，则前端需要显示 `已过期` 而不是 `领取`。
  - 如果 server 完全过滤过期记录，则前端 summary/badge 只统计真正可领项。
- Risks
  - 文案与颜色状态需要和现有 UI 风格保持一致。
- Verification commands
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/dapp lint`
- Expected outputs
  - 用户不再看到过期补贴的可点击领取按钮。

### Milestone 4: fork-anvil 回归验证
- Goal
  - 在当前 split 地址环境中复现并确认过期补贴不再误导用户。
- Affected files/modules
  - `config/promotion-envs/fork-anvil/*`
  - `docs/plan-excution/nft-subsidy-expiry-visibility/execution.md`
- Implementation notes
  - 复用现成的 `epoch #1` 过期、`epoch #2` 已领取场景。
  - 验证 claims 页汇总、单行按钮、底部 badge 是否一致。
- Risks
  - 本地浏览器缓存或旧 dev 进程再次干扰结果。
- Verification commands
  - `curl -s http://127.0.0.1:3210/api/v1/claims/me`（如便于认证/复现则用手工）
  - `pnpm --dir apps/dapp build`（如需要）
- Expected outputs
  - 过期补贴不再显示可领，用户不会再点出失败交易。

## 7. Approval Checkpoint
需要你确认后我再开始改代码。该任务涉及 claims 可领取状态，按仓库规则按 Critical 处理。

## 8. Rollback / Recovery Notes
- 若 server 口径调整导致 claims 列表异常，可先回退到仅在 dapp 隐藏过期按钮的保守方案。
- 若 shared model 变更引发前后端不兼容，可回退到保持原接口形状，仅在读取层过滤过期记录。

## 9. Final Verification Checklist
- [ ] server 不再把过期 NFT 补贴当作可领取返回
- [ ] claims 页不再为过期补贴展示“领取”按钮
- [ ] claims summary 不再把过期补贴计入“当前可领”
- [ ] 底部 claims badge 不再把过期补贴计入未领取数量
- [ ] 至少相关 server tests 与 dapp typecheck/lint 通过
- [ ] `execution.md` 记录真实改动与验证结果

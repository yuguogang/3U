# Execution

## Status
Completed.

## Summary
- 签到确认写路径已接入体量上卷与直推/间推内部账本奖励。
- `UserProfile` 与 `UserDailyStat` 现在会同步累计左右区、小区、直推、间推指标。
- 推广型 NFT 资格查询接口与 referral mint preview signer 边界已落地。
- Phase6 所需的 weekly ranking 原始日统计口径已具备，但还没有单独做周快照物化。

## Implemented
- `apps/server/src/modules/checkin/*`
  - 在签到事务内串接 volume propagation 与 referral rewards。
- `apps/server/src/modules/volume/*`
  - 实现基于 `TeamClosure` 路径的 deterministic 上卷引擎。
  - 实现 ancestor path 读取与左右区 / 小区累计写入。
- `apps/server/src/modules/rewards/*`
  - 实现 direct `10%` / indirect `5%` 的 AURA 奖励分配。
  - 使用 `sourceRefId + sourceType + userId` 查询实现幂等保护。
- `apps/server/src/modules/stats/*`
  - 扩展 team volume 与 referral reward 的 profile / daily projection 写入。
- `apps/server/src/modules/nft-eligibility/*`
  - 实现按累计签到次数和累计 small-leg volume 的资格判定。
  - 新增 `GET /nft-eligibility/current`。
- `apps/server/src/modules/signing/*`
  - 实现 referral mint preview payload 生成、nonce 递增、signed preview 元数据落库。
  - 新增 `POST /signing/referral-mint-preview`。
- `apps/server/src/modules/ledger/*`
  - 补充按来源查询已确认账本记录的 repository 能力。
- `apps/server/src/modules/*/*.spec.ts`
  - 增加 Phase4 覆盖的 volume / rewards / nft-eligibility / signing 单测。
  - 更新 checkin service 单测，覆盖体量上卷与推荐奖励编排。

## Commands Run
- `pnpm run build` in `packages/common`
- `pnpm run build` in `apps/server`
- `pnpm exec jest --runInBand` in `apps/server`
- `pnpm exec eslint "src/modules/{checkin,ledger,nft-eligibility,rewards,signing,volume}/**/*.ts"` in `apps/server`
- `pnpm run build` in `apps/server` after enum/DTO typing fix
- `pnpm exec jest --runInBand` in `apps/server` after enum/DTO typing fix

## Verification Results
- `packages/common` build：通过
- `apps/server` build：最终通过
- `apps/server` 全量测试：通过，`10` 个 suite / `27` 个测试全部通过
- 上卷引擎、推荐奖励、NFT 资格、signing preview、checkin 编排均有单测覆盖
- 目标范围 `eslint`：未通过；当前模块基线存在较多既有 `no-unsafe-*` / `prettier` / placeholder 风格债，未在本 phase 一并清理

## Deviations From Plan
- 没有新增独立的 dry-run / explain endpoint；当前以 eligibility current 查询和 signing preview 返回值承载第一版可观察性。
- 没有单独物化 weekly increment snapshot；当前依赖 `UserDailyStat.left/right/smallLeg` 作为 Phase6 周增量计算输入。
- 没有新增异步队列或补算 job；当前体量上卷和推荐奖励都在签到确认事务内同步完成。

## Risks / Follow-up
- `eslint` 仍未收敛，后续如果把 server lint 设为强门禁，需要先单独清理这些模块的类型与格式债。
- weekly ranking 目前依赖日统计聚合，Phase6 需要明确周边界聚合器与可重算脚本。
- signer 当前只输出 preview payload 和 nonce 元数据，还没有接真实私钥签名或链上验签联调。

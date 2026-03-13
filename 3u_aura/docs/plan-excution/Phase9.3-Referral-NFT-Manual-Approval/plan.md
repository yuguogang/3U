# Plan: Phase 9.3 - Referral NFT Manual Approval

## 1. Objective
将推广型 NFT 从“资格达标后自动签名 mint”切换为“资格达标后进入人工审批队列，管理员审批通过后才允许用户请求签名并 mint”的运营流程，同时保持现有合约入口、`chainId = 97` 测试链联调口径和 admin app 架构不变。

## 2. Scope
- 更新 spec 和执行计划文档中对推广型 NFT “自动资格签名”的表述
- 为推广型 NFT 引入人工审批状态机与审批审计字段
- 调整 `packages/common` 的 enums / models / validators
- 调整 Prisma schema 与 migration
- 调整 `apps/server` 中 `nft-eligibility`、`signing`、`admin` 模块
- 在 `apps/admin` 中新增 referral NFT 审批列表、审批动作、审批原因展示
- 在 `apps/dapp` 的 NFT 页面中新增“待审批 / 已拒绝 / 已批准待签名”用户态
- 将 `chainId = 97` 作为本 phase 的联调目标链写入验证与运行前提

## 3. Out of Scope
- 修改 `NFTSale` 合约或引入链上审批/撤销机制
- 已签发签名的链上撤销、签名吊销黑名单、nonce 回滚
- 多级审批、RBAC 角色体系、组织化后台
- `Phase10` 发行切换或 `Phase11` 税分红后台
- 把所有 NFT 异常处理都一次性 Web 化

## 4. Assumptions
- 当前推广型 NFT 合约入口保持 [NFTSale.sol](/Users/ygg/vs/ai/3U/3u_aura/apps/contracts/src/NFTSale.sol) 的 `mintNFTByReferral(...)` 不变
- 当前后端 signer 已完成，见 [Phase7.1 plan](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase7.1-Referral-Mint-Signer-Service/plan.md#L1)
- 当前 admin console 已完成最小运营闭环，见 [Phase9.2 plan](/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.2-Admin-Operator-Console-MVP/plan.md#L1)
- 当前 spec 仍写的是“后端验证资格后直接签名”，见 [spec §6.4](/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_AURA_Project_Spec_Merged_zh.md#L159)
- `chainId = 97` 仍是当前 promotion 联调测试链

## 5. Workflow Decision
本 phase 采用“单审批队列 + 单人审批 + 批准后再请求签名”的最小闭环，不直接引入复杂工作流。

### Recommended State Model
- `INELIGIBLE`
- `PENDING_APPROVAL`
- `APPROVED`
- `SIGNED`
- `MINTED`
- `REJECTED`
- `EXPIRED`
- `REVOKED`

### Intended Transitions
- 用户累计达标时：`INELIGIBLE -> PENDING_APPROVAL`
- 管理员批准时：`PENDING_APPROVAL / REJECTED -> APPROVED`
- 管理员拒绝时：`PENDING_APPROVAL / APPROVED -> REJECTED`
- 用户请求最终签名时：`APPROVED / EXPIRED -> SIGNED`
- 用户完成 mint 时：`SIGNED -> MINTED`
- 签名过期且未 mint 时：`SIGNED -> EXPIRED`
- 人工撤销资格时：`APPROVED / REJECTED / EXPIRED -> REVOKED`

### Critical Constraint
- 当前合约不支持“已签发签名”的链下撤销。
- 因此本 phase 的人工审批只能**控制签名发放前的准入**，不能承诺“签名发出后仍可撤销”。
- 如果业务要求“签名发出后可实时吊销”，必须另开合约扩展任务，不能把它伪装进本 phase。

## 6. Architecture Impact
- Spec / plans:
  - `docs/spec/3U_AURA_Project_Spec_Merged_zh.md`
  - `docs/plan-excution/Phase9.2-Admin-Operator-Console-MVP/*`
  - `docs/plan-excution/Phase9.3-Referral-NFT-Manual-Approval/*`
- Shared:
  - `packages/common/src/enums/aura.ts`
  - `packages/common/src/models/promotion.ts`
  - `packages/common/src/models/admin.ts`
  - `packages/common/src/validators/promotion.ts`
  - `packages/common/src/validators/admin.ts`
- Schema:
  - `apps/server/prisma/schema.prisma`
  - `apps/server/prisma/migrations/*`
- Server:
  - `apps/server/src/modules/nft-eligibility/*`
  - `apps/server/src/modules/signing/*`
  - `apps/server/src/modules/admin/*`
  - `apps/server/src/modules/audit/*`
- Admin UI:
  - `apps/admin/src/features/lists/components/nft-eligibility-page.tsx`
  - `apps/admin/src/features/overview/components/overview-page.tsx`
  - `apps/admin/src/api/admin.ts`
  - `apps/admin/src/queries/admin.query.ts`
- DApp:
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - `apps/dapp/src/api/promotion.ts`
  - `apps/dapp/src/queries/promotion.query.ts`

## 7. Risks
- 如果只改 UI 不改 server 状态机，用户仍可绕过后台直接请求签名
- 如果审批元数据只写 `AdminAuditLog` 不落主表，后续资格列表无法稳定展示“谁批准/谁拒绝/为什么”
- 如果 eligibility refresh 仍自动把达标用户写成 `ELIGIBLE`，人工审批会被后台重算覆盖
- 如果 DApp 不区分 `PENDING_APPROVAL / REJECTED / APPROVED`，用户会把“待审”和“系统故障”混为一谈
- 如果把“拒绝”做成永久终态，没有重新审批入口，会让运营只能靠改库修复误判
- 如果在没有远程 `97` 环境变量和地址的情况下把“测试链联调”写成已完成，会造成虚假闭环

## 8. Milestones

### Milestone 1 — Freeze Manual Approval Workflow And Spec
**Goal**
- 冻结人工审批业务语义、状态机和文档口径，避免实现中途在“自动签名”和“人工审批”之间摇摆

**Affected files/modules**
- `docs/spec/3U_AURA_Project_Spec_Merged_zh.md`
- `docs/plan-excution/Phase9.2-Admin-Operator-Console-MVP/*`
- `docs/plan-excution/Phase9.3-Referral-NFT-Manual-Approval/*`

**Implementation notes**
- 将 spec 从“后端验证资格 -> 直接签名”改为“资格达标 -> admin 审批 -> 用户请求签名 -> 用户 mint”
- 明确拒绝并不等于永久取消资格，admin 可以后续重新批准
- 明确本 phase 不承诺“已签发签名可撤销”
- 统一 `chainId = 97` 为本 phase 联调目标链

**Risks**
- 文档不先更新，后续 code review 会长期被旧 spec 和旧 execution 口径干扰

**Verification commands**
- `test -f /Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.3-Referral-NFT-Manual-Approval/plan.md`
- `rg -n "自动资格签名|人工审批|referral NFT" /Users/ygg/vs/ai/3U/3u_aura/docs/spec /Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution`

**Expected outputs**
- spec 与计划文档对人工审批流程表述一致
- “签发后不可撤销”的约束被明确写入

### Milestone 2 — Schema And Shared Contract Alignment
**Goal**
- 为人工审批引入可靠的状态与元数据字段，并同步 shared enums / validators

**Affected files/modules**
- `packages/common/src/enums/aura.ts`
- `packages/common/src/models/promotion.ts`
- `packages/common/src/models/admin.ts`
- `packages/common/src/validators/promotion.ts`
- `packages/common/src/validators/admin.ts`
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/migrations/*`

**Implementation notes**
- 扩展 `NftEligibilityStatus`，至少覆盖 `PENDING_APPROVAL / APPROVED / REJECTED`
- 在 `NftReferralEligibility` 主表中增加审批元数据，例如：
  - `approvedAt`
  - `approvedByWallet`
  - `rejectedAt`
  - `rejectedByWallet`
  - `decisionReason`
- admin / dapp 的 request/response contract 不允许各自重定义状态字面量
- migration 必须兼容现有 `ELIGIBLE / SIGNED / MINTED` 数据

**Risks**
- 旧数据如何迁移到新状态如果不明确，会让线上数据语义错乱

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec prisma validate --schema prisma/schema.prisma`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run db:generate`
- `cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build`

**Expected outputs**
- Prisma schema 合法
- shared contracts 可编译
- 新老状态映射策略清晰可审计

### Milestone 3 — Server Approval Workflow And Signer Gate
**Goal**
- 把人工审批真正变成 server 强约束，而不是前端提示文案

**Affected files/modules**
- `apps/server/src/modules/nft-eligibility/*`
- `apps/server/src/modules/signing/*`
- `apps/server/src/modules/admin/*`
- `apps/server/src/modules/audit/*`

**Implementation notes**
- `NftEligibilityPolicyEngine` 需要从“自动写 `ELIGIBLE`”切到“达标即进入 `PENDING_APPROVAL`”
- 新增 admin API：
  - list pending approvals
  - approve referral NFT
  - reject referral NFT
  - optional revoke approval
- `referral-mint-signature` endpoint 只允许 `APPROVED / EXPIRED` 或你最终冻结的白名单状态
- 审批动作必须写 `AdminAuditLog`
- 审批和签名是两个动作，不在 approve API 内直接发签名

**Risks**
- 如果 approve 接口顺手直接签名，会把审批和授权重新耦合，失去人工审批的价值
- 如果 eligibility 重算覆盖掉 `REJECTED / APPROVED`，后台状态会抖动

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand nft-eligibility signing admin`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- 用户未经审批无法获取最终 referral NFT 签名
- admin 审批/拒绝接口可审计
- server build 与相关测试通过

### Milestone 4 — Admin Approval Surface
**Goal**
- 在 `apps/admin` 提供真正可用的审批队列和审批动作

**Affected files/modules**
- `apps/admin/src/features/lists/components/nft-eligibility-page.tsx`
- `apps/admin/src/features/overview/components/overview-page.tsx`
- `apps/admin/src/api/admin.ts`
- `apps/admin/src/queries/admin.query.ts`
- `apps/admin/src/features/lists/components/shared.tsx`

**Implementation notes**
- NFT eligibility 页面至少要区分：
  - `PENDING_APPROVAL`
  - `APPROVED`
  - `REJECTED`
  - `SIGNED`
  - `MINTED`
- 审批 UI 至少提供：
  - approve
  - reject with reason
  - decision metadata display
- overview 指标补充：
  - pending approval count
  - approved-not-signed count
  - signed-not-minted count
- 继续保留 `apps/admin` 的 allowlist wallet 登录模型，不扩展到 RBAC

**Risks**
- 如果 admin 只能列表浏览、不能给出拒绝原因，运营排障会退回线下沟通

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run lint`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run build`

**Expected outputs**
- admin 可在 UI 中完成 referral NFT 审批和拒绝
- 后台 overview 与列表能反映新状态

### Milestone 5 — DApp NFT Approval UX
**Goal**
- 让普通用户在 DApp 中清楚看到审批状态，而不是继续看到自动签名体验

**Affected files/modules**
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/api/promotion.ts`
- `apps/dapp/src/queries/promotion.query.ts`
- `packages/common/src/models/promotion.ts`

**Implementation notes**
- NFT 页面需要区分：
  - 达标但待审批
  - 已拒绝及原因
  - 已批准，可请求签名并 mint
  - 已签发但尚未 mint
- 未批准状态下，DApp 不再显示“立即获取签名”
- 对已拒绝用户显示明确的人工处理状态，而不是泛化错误 toast

**Risks**
- 如果 DApp 仍使用旧的自动 mint CTA，用户会反复触发本不该出现的失败请求

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`

**Expected outputs**
- 用户在 NFT 页面能理解当前审批状态
- DApp 与 server 的审批状态 contract 一致

### Milestone 6 — `chainId = 97` Integration Readiness
**Goal**
- 为 BSC Testnet `97` 的人工审批联调准备环境边界和验证清单

**Affected files/modules**
- `docs/plan-excution/Phase9.3-Referral-NFT-Manual-Approval/*`
- `apps/server/src/configuration/*` if env notes need extension
- `apps/admin` / `apps/dapp` environment docs if required

**Implementation notes**
- 冻结需要的测试链前提：
  - `NFTSale` 地址
  - `FounderNFT` 地址
  - `USDT` 测试代币地址
  - signer key
  - admin allowlist wallets
  - RPC URL
- 形成联调 checklist：
  - 用户达标 -> 进入待审批
  - admin approve
  - 用户获取签名
  - 用户在 `97` 成功 mint
  - 后台看到 `SIGNED/MINTED` 变化
- 如果执行阶段没有真实 RPC / 地址 / 私钥，就只能标记为“代码级 ready”，不能写成“测试链已完成”

**Risks**
- 把本地 build 通过误记成 `97` 实链验证通过，会形成虚假完成

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`

**Expected outputs**
- 测试链联调前提条件清单明确
- 执行阶段可以清楚区分“本地验证通过”和“97 实链联调通过”

## 9. Approval Checkpoint
- 这是 `Critical` 任务，涉及 NFT 资格、审批权限、签名授权和 schema 变更
- 必须在 `plan.md` 审批后再进入实现

## 10. Rollback / Recovery Notes
- 如果人工审批状态机导致 signer 全面不可用，优先关闭审批入口或临时恢复自动签名代码路径，而不是直接改库绕过
- 如果 migration 导致现有 eligibility 状态异常，需要保留旧状态到新状态的回滚说明
- 如果执行中发现“签名发出后仍需撤销”是强需求，应立即停下并单独开合约扩展任务，不在本 phase 强行补丁
- admin 审批动作必须依赖审计；如果审计写入失效，应停止 execute 类操作

## 11. Final Verification Checklist
- [ ] spec 已改为人工审批口径
- [ ] `NftEligibilityStatus` 已覆盖人工审批状态
- [ ] Prisma migration 已生成并通过 validate/generate
- [ ] eligibility 重算不会自动绕过人工审批
- [ ] `referral-mint-signature` endpoint 不再允许未经批准用户获取签名
- [ ] admin UI 可 approve / reject 并显示原因
- [ ] dapp NFT 页面能正确展示待审批 / 已拒绝 / 已批准状态
- [ ] shared contracts 在 admin/dapp/server 三端一致
- [ ] `packages/common` build 通过
- [ ] `apps/server` build 和相关 tests 通过
- [ ] `apps/admin` lint / typecheck / build 通过
- [ ] `apps/dapp` lint / typecheck / build 通过
- [ ] `chainId = 97` 联调前提条件和实际完成状态被明确记录

## 12. Approval Request
请审批 `Phase9.3-Referral-NFT-Manual-Approval`。审批后再开始实现。

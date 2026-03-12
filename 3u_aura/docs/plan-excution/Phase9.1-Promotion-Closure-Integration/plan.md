# Plan: Phase 9.1 - Promotion Closure Integration

## 1. Objective
补齐推广阶段 MVP 目前剩余的关键联调缺口，使 promotion 流程从“主要能力已实现”推进到“核心路径真实闭环可联调”：

- DApp 接入推广型 NFT 最终 signer payload 并真正调用 `mintNFTByReferral`
- check-in 从 request-bound 验证升级到真实链上支付验证 seam
- claim 成功后的 server 状态回写与同步入口落地
- 以 `chainId = 97` 测试链完成首轮跨层 closure 验证

## 2. Scope
- `apps/dapp` referral NFT 最终 mint 接线
- `apps/server` check-in 验链适配层与配置边界
- `apps/server` claim success sync / writeback API 或可重放同步路径
- `packages/common` 必要的 shared contract / model / validator 扩展
- `chainId = 97` 测试链联调所需的配置切换与验证矩阵
- promotion 阶段跨层联调验证与执行记录补充

## 3. Out of Scope
- `Phase10` 发行切换
- `Phase11` 税、分红、回购、销毁
- 完整 indexer 平台或长期事件订阅基础设施
- 团队树图形化 read model
- KMS / MPC / signer 基础设施升级
- 正式主网上线与 `chainId = 56` 发布切换

## 4. Assumptions
- `Phase2` 到 `Phase9` 以及 `Phase7.1` 已完成并通过当前 build/test 验证
- 推广型 NFT 后端 signer 已可返回最终 `signature / digest / nonce / expiry`
- 当前 DApp NFT 页面仍停留在 preview-only，尚未消费最终 signer payload
- 当前 check-in 主写路径仍未接入真实 RPC / USDT Transfer 验证
- 当前 claims 页面链上成功后，server 状态仍会滞后，尚无明确回写入口
- 首轮联调统一以 `chainId = 97` 测试链进行，主网链切换留到后续发布阶段
- `chainId = 97` 上会有对应的：
  - NFTSale
  - Settlement
  - MerkleClaim
  - 测试用 USDT / payment token
- 所有 promotion chain 相关逻辑必须保持可配置，不能把 `56` 写死到实现里
- 本阶段优先补最小可审计闭环，不追求一次性建设完整 indexer

## 5. Current State
- DApp 目前只调用 `POST /api/v1/signing/referral-mint-preview`，没有消费 [referral-mint-signature](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/signing/signing.controller.ts#L34)
- NFT 页面明确写着“final signature pending backend upgrade”，但后端 `Phase7.1` 已经补完 signer 服务；前后端语义已漂移
- check-in 当前仅以 `chainId + txHash` 等请求数据做 deterministic 边界，未校验真实链上 USDT payment
- claims 页面链上交易成功后只在本地做 `submitted` 标记，server 不会更新 `txHash / claimedAt / status`
- promotion 阶段虽然大部分 phase 已 completed，但还缺真实联调闭环与发布前可操作路径
- 当前前后端和 DApp 多处默认 claim / promotion chain 为 `56`，与“先在 `97` 测试链联调”的新要求尚未正式对齐

## 6. Target State
- 用户在 DApp 上可直接完成推广型 NFT 最终 mint，而不是只看 preview
- check-in 入口具备真实链上支付验证 seam，可验证：
  - `txHash`
  - `payer`
  - `receiver`
  - `token`
  - `amount`
- claim 成功后 server 可以同步记录链上结果，DApp 不再只依赖本地提交态
- DApp / server / contracts 相关配置可在 `chainId = 97` 测试链下完成首轮联调，不要求先切回 `56`
- promotion 阶段形成一轮明确的 closure checklist，为 `Phase10` 前的评审提供依据

## 7. Architecture Impact
- `apps/dapp/src/api/promotion.ts`
- `apps/dapp/src/queries/promotion.query.ts`
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/components/pages/checkin-page.tsx`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `apps/server/src/modules/signing/*`
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/payment/*`
- `apps/server/src/modules/claims/*`
- `apps/server/src/configuration/*`
- `packages/common/src/models/promotion.ts`
- `packages/common/src/validators/promotion.ts`
- `apps/dapp/.env*`

## 8. Risks
- referral NFT mint 若 DApp 组装合约参数出错，会直接导致用户侧 revert
- check-in 若没有真实链上支付验证，推广阶段资金事实仍不具备生产级可信度
- claim 回写若缺乏幂等键，会出现重复确认或状态漂移
- 为补 closure 临时加入过多“半成品 indexer”会扩大 blast radius
- 若在无明确配置白名单下接入 RPC / contract address，会引入错误链、错误合约的误确认风险
- 若 `97` 测试链联调要求没有被显式固化，后续实现很容易继续沿用 `56` 默认值，导致测试结论失真

## 9. Milestones

### Milestone 1 — Referral NFT final mint closure
**Goal**
- 让 DApp 消费最终 signer payload，并真正执行 `mintNFTByReferral`

**Affected files/modules**
- `packages/common/src/models/promotion.ts`
- `apps/dapp/src/api/promotion.ts`
- `apps/dapp/src/queries/promotion.query.ts`
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/lib/promotion-contracts.ts`

**Implementation notes**
- DApp 新增 final signer API 调用，不再只使用 preview
- DApp 的 promotion chain、NFTSale 地址、payment token 地址都必须从测试链配置读取，并以 `97` 作为首轮联调目标
- NFT 页面需要明确区分：
  - preview / eligibility 信息
  - final sign & mint 动作
  - 交易提交 / receipt 状态
- 前端合约调用必须严格使用 server 返回的：
  - `nonce`
  - `expiry`
  - `signature`
- 仍保留 preview 作为可观察性调试入口，但 UI 主流程切到 final signer

**Risks**
- UI 同时持有 preview payload 和 final payload，容易误用
- 钱包链与 signer payload chainId 不一致时，用户体验容易混乱

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run lint`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`

**Expected outputs**
- DApp 可发起最终 referral NFT mint
- 页面不再显示“backend still exposes preview only”之类过时文案
- `chainId = 97` 下 DApp 能正确识别网络和合约地址
- dapp lint / typecheck / build 通过

**Approval checkpoint**
- yes

### Milestone 2 — Check-in on-chain payment verification seam
**Goal**
- 将 check-in 从 request-bound 验证升级为真实链上 payment verification seam

**Affected files/modules**
- `apps/server/src/configuration/*`
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/payment/*`
- `packages/common/src/*`

**Implementation notes**
- 保持“事务外验链，事务内落库”原则不变
- 新增 payment verification adapter，最小验证项至少包括：
  - tx receipt 存在且成功
  - token contract == configured USDT
  - receiver == configured treasury/check-in receiver
  - payer == request.payerAddress
  - amount == 3 USDT 原子单位
- 首轮联调按 `chainId = 97` 测试链 payment token 与 receiver 配置完成，不要求先接入主网地址
- 若当前仓库还不具备完整 event indexer，本 phase 仍以“按 txHash 即时查链 + deterministic parse”实现，不扩展成长期监听器
- 所有链配置必须从 config 注入，不能硬编码到 service

**Risks**
- RPC 不可用会让 check-in path 变脆弱
- 不同链/不同 token transfer 解析差异会造成误判

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm exec eslint src/modules/checkin/**/*.ts src/modules/payment/**/*.ts src/configuration/*.ts`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand checkin`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- check-in service 在无效 tx / 错 token / 错金额 / 错收款地址时拒绝入账
- 保留 duplicate / repair 幂等行为
- `chainId = 97` 的测试链支付验证配置已正式纳入 server config
- server build 和 checkin 定向测试通过

**Approval checkpoint**
- yes

### Milestone 3 — Claim success sync-back and idempotent writeback
**Goal**
- 为 weekly merkle claim / NFT subsidy claim 提供 server 侧成功回写路径

**Affected files/modules**
- `apps/server/src/modules/claims/*`
- `apps/dapp/src/api/claims.ts`
- `apps/dapp/src/queries/claims.query.ts`
- `apps/dapp/src/components/pages/claims-page.tsx`
- `packages/common/src/models/promotion.ts`

**Implementation notes**
- 不要求一步到位做完整 indexer，可先实现：
  - authenticated sync endpoint 或 admin-safe repair/sync path
  - 基于 `claimRecordId / subsidyClaimId + txHash` 的幂等写回
- server 回写至少应记录：
  - `txHash`
  - `claimedAt`
  - `status`
- DApp 在 receipt 成功后触发 server sync，而不是永久停留在 local submitted state
- `MerkleClaim / Settlement` 的测试链地址以 `chainId = 97` 配置为准完成首轮联调
- 若需要同时支持重放修复，应保留脚本或 service 入口

**Risks**
- claim 状态机若与链上收据脱节，会出现 server 先确认但链上失败的伪成功
- 没有幂等键会让重复 sync 污染状态

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand claims`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`

**Expected outputs**
- claims 页面不再只依赖 local submitted marker
- server 可幂等记录 claim success 事实
- `chainId = 97` 下 claims 相关合约交互与回写路径可联调
- build/test 通过

**Approval checkpoint**
- yes

### Milestone 4 — Promotion closure verification package
**Goal**
- 对 promotion 阶段形成明确的跨层 closure checklist 和残余风险归档

**Affected files/modules**
- `docs/plan-excution/Phase9.1-Promotion-Closure-Integration/*`
- `docs/plan-excution/Phase9-Dapp-Promotion-MVP/execution.md`
- 视需要更新 `Phase2 / Phase7.1 / Phase9` execution 中的残余说明

**Implementation notes**
- 明确列出已真正闭环的路径：
  - check-in
  - inviter bind + placement
  - weekly reward publish
  - purchased NFT buy
  - referral NFT mint
  - weekly claim
  - subsidy claim
- closure checklist 必须区分：
  - `chainId = 97` 已联调通过项
  - 仍未推进到主网配置冻结的项
- 同时列出未纳入本阶段的残余项，避免误判为“全项目完成”
- 本 milestone 不替代 `Phase12`，只是 promotion 阶段的 pre-launch closure note

**Risks**
- closure 文档不准确会影响 Phase10 评审判断

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/dapp && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test`

**Expected outputs**
- promotion 阶段已闭环能力与残余风险清单明确
- `chainId = 97` 测试链联调结论与环境依赖清楚记录
- 为后续 `Phase10 + Phase11` 提供更干净的入口

**Approval checkpoint**
- yes

## 10. Approval Checkpoint
- 这是 `Critical` 任务
- 涉及支付确认、NFT mint 授权、claim 状态回写与资金/资格事实同步
- 必须在 plan 审批后再进入实现

## 11. Rollback / Recovery Notes
- 若 final signer 接线存在问题，优先保留 preview-only 能力并隐藏最终 mint 按钮
- 若真实链上验链不稳定，优先关闭 production check-in 入口，不要降级到无验链自动确认
- claim sync-back 若出现状态漂移，必须保留 repair / replay 路径，而不是手工改库
- 所有新增链配置必须允许按环境关闭，避免本地开发被强耦合到外部 RPC
- `97` 测试链联调配置与未来 `56` 主网配置必须隔离，不能共用一套硬编码地址

## 12. Final Verification Checklist
- [ ] DApp 已接入 `referral-mint-signature` 并可真正执行 referral NFT mint
- [ ] NFT 页面不再保留过时的 preview-only 主流程文案
- [ ] check-in 使用真实链上 payment verification seam
- [ ] 错 token / 错金额 / 错收款地址 / 错 payer 的 tx 无法入账
- [ ] claim 成功后 server 可同步记录 `txHash / claimedAt / status`
- [ ] DApp 不再只依赖 local submitted marker 展示 claim 结果
- [ ] `chainId = 97` 测试链已纳入 DApp / server / contracts 联调配置
- [ ] 所有 promotion chain 相关值均保持可配置，不写死 `56`
- [ ] common / server / dapp / contracts 验证命令通过
- [ ] promotion 阶段 closure note 已形成

## 13. Approval Request
请审批 `Phase9.1-Promotion-Closure-Integration`；通过后再开始实现 promotion 阶段剩余联调与闭环收口。

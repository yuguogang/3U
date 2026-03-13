# Plan: Phase 9.2 - Admin Operator Console MVP

## 1. Objective
补齐 promotion 阶段缺失的最小 admin/operator 闭环，使项目从“用户主流程可跑”推进到“运营可观察、可审计、可修复”：

- 建立独立的 admin/operator web console
- 补齐后台权限校验，不再停留在“admin login 但未真正鉴权”
- 将关键 operator 写动作纳入统一审计
- 提供 promotion 阶段所需的统计、异常列表、修复/同步入口
- 保持当前业务口径不变：`referral NFT` 仍为自动资格签名，不在本 phase 切到人工审批

## 2. Scope
- 新建独立 `apps/admin`，不把后台能力继续塞进 `apps/dapp`
- `apps/server` admin auth / admin guard / admin allowlist / 审计持久化
- promotion 阶段 admin 只读面板：
  - 总体统计
  - 用户检索
  - 待挂树 / 已挂树概况
  - check-in / rewards / claims / NFT eligibility 异常视图
  - audit trail
- promotion 阶段最小 operator 动作：
  - claim sync replay
  - weekly epoch sync
  - check-in repair 入口
  - 只读/干跑入口优先于直接执行
- `packages/common` 所需 admin contracts / validators / models 扩展
- 首轮联调仍以 `chainId = 97` promotion 测试链环境为准
- UI / 目录结构参考：
  - `/Users/ygg/vs/ai/abc/3legs/apps/dashboard`
  - 仅借鉴其 `layout / features / api / queries / table` 分层，不直接搬运业务代码

## 3. Out of Scope
- 将 `referral NFT` 改成“人工审批后才允许签名 mint”
- `Phase10` 发行切换后台
- `Phase11` 税、分红、回购、销毁运营后台
- 通用 RBAC 平台、多角色组织系统、SSO
- 把所有 repair script 一次性全部 Web 化
- 完整 BI / 数据仓库 / 图表平台
- 主网上线控制台与多链切换编排

## 4. Assumptions
- `Phase9.1` 已完成，promotion 用户主路径已闭环
- 现有 [AdminAuthController](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/admin-auth.controller.ts#L1) 只实现了登录外形，尚未真正校验管理员权限
- 现有 [AdminAuditLog](/Users/ygg/vs/ai/3U/3u_aura/apps/server/prisma/schema.prisma#L777) 表已存在，但 [AuditLogRepository](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/audit/repositories/audit-log.repository.ts#L1) 仍是 no-op
- 现有 admin 能力仅有：
  - [admin-auth.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/auth/controllers/admin-auth.controller.ts#L1)
  - [admin-user.controller.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/user/controllers/admin-user.controller.ts#L1)
  - 若干 repair / sync scripts
- 当前 promotion 运营最缺的不是更多用户页面，而是：
  - 可观察统计
  - 异常列表
  - 幂等 repair/sync 入口
  - 审计落库
- 参考 dashboard 的合理借鉴点是：
  - `src/app/dashboard/*`
  - `src/features/*`
  - `src/components/layout/*`
  - `src/api/*`
  - `src/queries/*`
- 参考 dashboard 中与本项目无关的业务域、清理脚本、第三方接入不会照搬

## 5. Architecture Decision
- 推荐新增独立 `apps/admin`
- 不推荐将 admin/operator 能力继续放进 `apps/dapp`

**Reasoning**
- 权限边界不同：`apps/dapp` 面向普通用户钱包流程，`apps/admin` 面向受限 operator
- 依赖不同：admin 需要更多列表、查询、审计和 repair UI，不应污染 dapp 导航与构建边界
- 部署与访问控制不同：后台通常需要单独域名、入口保护、allowlist、审计
- 未来若切换到 referral NFT 人工审批，也应落在 admin app，而不是用户 dapp

## 6. Architecture Impact
- New app:
  - `apps/admin/*`
- Server:
  - `apps/server/src/auth/*`
  - `apps/server/src/modules/audit/*`
  - `apps/server/src/modules/admin/*` or equivalent admin read/action modules
  - `apps/server/src/modules/claims/*`
  - `apps/server/src/modules/checkin/*`
  - `apps/server/src/modules/epoch/*`
  - `apps/server/src/modules/nft-eligibility/*`
  - `apps/server/src/modules/referral/*`
  - `apps/server/src/configuration/*`
- Shared:
  - `packages/common/src/models/*`
  - `packages/common/src/validators/*`

## 7. Risks
- 后台若没有真实 admin allowlist，只是“换个登录页”，等于没有权限边界
- repair/sync 操作如果不具备幂等和审计，会直接破坏资金/资格事实可信度
- 如果把 admin UI 建在 `apps/dapp` 内，后续会出现 session、导航、依赖、访问控制混杂
- 如果过早把 referral NFT 改成人工审批，会扩大状态机和权限 blast radius，拖慢当前进度
- 如果所有脚本都急着 Web 化，会把高风险操作暴露得过宽

## 8. Milestones

### Milestone 1 — Freeze Admin Architecture And Security Model
**Goal**
- 冻结后台应用形态、登录方式、权限边界和目录结构

**Affected files/modules**
- `docs/plan-excution/Phase9.2-Admin-Operator-Console-MVP/*`
- `apps/admin/*`
- `apps/server/src/auth/*`
- `apps/server/src/configuration/*`

**Implementation notes**
- 确认后台新建为独立 `apps/admin`
- 后台登录沿用钱包签名登录，但必须新增真实 admin allowlist 校验
- allowlist 可先走 config/env，后续再考虑迁移到 `SystemConfig`
- 后台 API 路径统一走 `/api/v1/admin/*`
- 参考 `/Users/ygg/vs/ai/abc/3legs/apps/dashboard` 的目录组织：
  - `app/dashboard/*`
  - `features/<domain>`
  - `components/layout`
  - `api + queries`
- 不直接复制 3legs dashboard 的业务代码、i18n、cleanup 产物、第三方接入

**Risks**
- 架构不先冻结，后面容易在 `apps/dapp` 和 `apps/admin` 之间摇摆

**Verification commands**
- `test -f /Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/Phase9.2-Admin-Operator-Console-MVP/plan.md`

**Expected outputs**
- 独立 admin app 方案明确
- admin auth / allowlist / audit 的系统边界明确

**Approval checkpoint**
- yes

### Milestone 2 — Admin Auth Hardening And Audit Persistence
**Goal**
- 将现有“伪 admin 登录”升级为真正受限后台入口，并让 operator 写动作进入审计表

**Affected files/modules**
- `apps/server/src/auth/controllers/admin-auth.controller.ts`
- `apps/server/src/auth/*`
- `apps/server/src/modules/audit/*`
- `apps/server/src/configuration/*`
- `apps/server/prisma/schema.prisma` if required for minor audit compatibility only

**Implementation notes**
- 新增 `AdminJwtGuard` 或 `AdminPermissionGuard`
- `admin/auth/login` 完成签名登录后，必须校验地址是否在 admin allowlist
- admin token / session 与普通用户入口要有明确区分
- [AuditLogRepository](/Users/ygg/vs/ai/3U/3u_aura/apps/server/src/modules/audit/repositories/audit-log.repository.ts#L1) 从 no-op 落为真实 `AdminAuditLog` 持久化
- 所有 admin 写入口统一调用 audit trail，不允许页面直接打脚本

**Risks**
- 若普通用户 JWT 仍可直接访问 admin route，会形成严重权限漏洞
- 审计字段设计过窄，会让后续 operator 行为不可追溯

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand auth audit`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- admin 登录具备真实权限校验
- audit repository 已真实持久化 `AdminAuditLog`
- 普通用户无法访问 admin route

**Approval checkpoint**
- yes

### Milestone 3 — Promotion Operator Read Models And Admin APIs
**Goal**
- 提供后台统计与异常检索面，先解决“看得见”

**Affected files/modules**
- `apps/server/src/modules/admin/*` or equivalent
- `apps/server/src/modules/claims/*`
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/epoch/*`
- `apps/server/src/modules/nft-eligibility/*`
- `apps/server/src/modules/referral/*`
- `packages/common/src/models/*`
- `packages/common/src/validators/*`

**Implementation notes**
- overview metrics 最少覆盖：
  - user total / recent growth
  - pending placement count
  - eligible referral NFT count
  - signed-not-minted referral NFT count
  - latest weekly epoch status
  - claimable / claimed counts
- 列表页最少覆盖：
  - 用户检索
  - 待挂树列表
  - check-in 异常/补单候选
  - claim sync 异常
  - NFT eligibility / signed / minted 状态列表
  - audit trail
- 所有后台查询 contract / DTO / pagination 从 `packages/common` 收敛

**Risks**
- 如果 overview 直接从 controller 拼 Prisma 聚合，后面会变成不可维护的大杂烩
- 如果异常视图没有稳定筛选字段，运营页面会退化成纯展示

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/packages/common && pnpm run build`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand admin`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- admin overview 可显示 promotion 核心统计
- admin API 可支撑用户、异常、审计三类后台页面

**Approval checkpoint**
- yes

### Milestone 4 — Operator Actions MVP
**Goal**
- 提供最小、可审计、幂等的后台操作入口，先解决“能修复”

**Affected files/modules**
- `apps/server/src/modules/admin/*`
- `apps/server/src/modules/claims/*`
- `apps/server/src/modules/checkin/*`
- `apps/server/src/modules/epoch/*`
- existing `apps/server/scripts/*` if wrappers are needed
- `packages/common/src/models/*`
- `packages/common/src/validators/*`

**Implementation notes**
- 第一版只纳入 blast radius 可控的动作：
  - claim sync replay
  - weekly epoch sync
  - check-in repair
- 优先做 `dry-run -> execute` 两阶段
- 后台动作必须通过 service/repository 调用，不直接让 Web 页面执行 shell script
- 所有动作要求：
  - explicit business key
  - idempotent behavior
  - audit trail
  - clear success/failure result payload
- `tree repair`、`reward republish`、`root republish` 这类高风险动作先不纳入 MVP

**Risks**
- 直接暴露高风险写动作，会把后台变成危险的“在线改库入口”
- 没有 dry-run 的 repair 很难评审和复核

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm test -- --runInBand checkin claims epoch`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/server && pnpm run build`

**Expected outputs**
- operator 可在后台安全触发最关键的 replay / repair / sync 动作
- 每次动作都有 `AdminAuditLog` 记录

**Approval checkpoint**
- yes

### Milestone 5 — `apps/admin` UI Shell And Feature Pages
**Goal**
- 用独立后台应用承载 overview、列表、操作台

**Affected files/modules**
- `apps/admin/src/app/*`
- `apps/admin/src/components/layout/*`
- `apps/admin/src/features/*`
- `apps/admin/src/api/*`
- `apps/admin/src/queries/*`
- `apps/admin/src/lib/*`
- `apps/admin/package.json`

**Implementation notes**
- 参考 `/Users/ygg/vs/ai/abc/3legs/apps/dashboard` 的 UI 分层，但不照搬视觉和业务文案
- 建议首批页面：
  - `/dashboard`
  - `/dashboard/users`
  - `/dashboard/placements`
  - `/dashboard/checkins`
  - `/dashboard/claims`
  - `/dashboard/nft-eligibility`
  - `/dashboard/audit`
  - `/dashboard/ops`
- 复用 `api/query/layout/table` 组织方式
- UI 以桌面后台优先，不要求移动端优先设计
- 先接通 cookie/session admin auth，再接只读与操作入口

**Risks**
- 如果先堆页面再补 auth，会出现“能看但不安全”的错误顺序
- 如果 UI 一开始追求复杂图表，会拖慢真正需要的 operator 页面

**Verification commands**
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run lint`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/admin && pnpm run build`

**Expected outputs**
- 独立 admin console 可登录、可看统计、可查异常、可触发最小 operator 动作

**Approval checkpoint**
- yes

## 9. Approval Checkpoint
- 这是 `Critical` 任务
- 涉及后台权限、审计、repair/sync、check-in/claim/operator 入口
- 必须在 plan 审批后再进入实现

## 10. Rollback / Recovery Notes
- 若 `apps/admin` 落地中途失败，不回退 `apps/dapp`，而是保持 admin app 独立暂停
- 若 admin auth 未完成，不允许先开放后台页面到可访问环境
- 若审计持久化未完成，不允许开放任何后台写动作
- 若 operator action 无法做到幂等和审计，则继续保留脚本路径，不强行 Web 化
- 若后续决定改 referral NFT 为人工审批，应新开扩展任务，不在本 MVP 中途插改状态机

## 11. Final Verification Checklist
- [ ] 独立 `apps/admin` 架构已冻结
- [ ] admin 登录具备真实 allowlist / permission 校验
- [ ] 普通用户 JWT 无法访问 admin route
- [ ] `AdminAuditLog` 已从 no-op 变为真实持久化
- [ ] admin overview 可展示 promotion 核心统计
- [ ] admin 列表页可查看用户、异常、审计信息
- [ ] 至少 3 个最小 operator 动作具备 `dry-run / execute / audit`
- [ ] `apps/admin` lint / typecheck / build 通过
- [ ] `apps/server` 相关 auth / audit / admin / operator tests 通过
- [ ] 当前业务口径仍保持“referral NFT 自动资格签名”，未被隐式改成人工审批

## 12. Approval Request
请审批 `Phase9.2-Admin-Operator-Console-MVP`；通过后再开始实现独立 admin app、后台权限、审计持久化与最小 operator 闭环。

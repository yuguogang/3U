# Plan: Phase 1 - Infrastructure & Data Models

## 1. Objective
完成 monorepo 基础设施、PostgreSQL / Prisma 数据模型和 shared models 基线，为后续推广阶段能力提供可演进的底座。

## 2. Scope
- 切换数据库到 PostgreSQL
- 重建 Prisma schema，并保留关键业务键
- 配置 `docker-compose.yml`、数据库连接与 seed 流程
- 清理并同步 `packages/common` 的 shared models
- 完成基础验证

## 3. Out of Scope
- Check-in 业务编排
- 推荐树与体量上卷算法
- 周门票 / 抽奖 / 排名
- 智能合约实现
- DApp 页面与交互

## 4. Assumptions
- 本 Phase 为已完成的历史归档阶段，本次仅补齐到当前计划模板
- 后续 Phase 会继续演进 schema，但幂等键与核心关系模型必须稳定
- `packages/common` 继续作为 DTO / enum / schema 的共享源

## 5. Current State
- Phase 1 已完成并有独立执行记录
- 后续计划已基于该 Phase 的数据库与 shared models 基线展开

## 6. Target State
- 本地环境可启动
- Prisma schema 可校验
- 数据库可连接、可 seed
- shared models 可被后续模块复用

## 7. Architecture Impact
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/seed.ts`
- `docker-compose.yml`
- `packages/common/src/*`

## 8. Risks
- 历史 schema 重构与规范口径不一致
- 共享类型清理过度，影响后续模块
- 数据库配置漂移导致本地环境不可复现

## 9. Milestones

### Milestone 1 — Environment and database baseline
**Goal**
- 完成 PostgreSQL 切换、容器配置与基础数据库连通

**Affected files/modules**
- `docker-compose.yml`
- `apps/server/prisma/*`

**Implementation notes**
- 优先保证环境可复现，再进入 schema 细化

**Risks**
- 运行时配置与 Prisma 新版本约定不一致

**Verification**
- commands:
  - `npx prisma validate`
- expected result:
  - Prisma 配置和基础连接可通过校验

**Approval checkpoint**
- historical / completed

### Milestone 2 — Prisma schema reconstruction
**Goal**
- 按 3U AURA 规范重建 schema，并保留 `txHashKey` / `placementKey` 等关键字段

**Affected files/modules**
- `apps/server/prisma/schema.prisma`

**Implementation notes**
- 优先保证关系完整、唯一键清晰、后续 Phase 可扩展

**Risks**
- 关系反向字段缺失导致 schema 无法验证

**Verification**
- commands:
  - `npx prisma validate`
- expected result:
  - schema 校验通过，关键关系与唯一键完整

**Approval checkpoint**
- historical / completed

### Milestone 3 — Shared model synchronization and seed validation
**Goal**
- 清理 legacy common 代码并完成 seed 验证

**Affected files/modules**
- `packages/common/src/*`
- `apps/server/prisma/seed.ts`

**Implementation notes**
- 共享模型只保留当前协议需要的最小集合

**Risks**
- 清理 legacy 代码时误删后续依赖项

**Verification**
- commands:
  - `pnpm run build`
  - `pnpm run db:seed`
- expected result:
  - `packages/common` 可构建，seed 可成功执行

**Approval checkpoint**
- historical / completed

## 10. Rollback / Recovery Notes
- 历史阶段已完成；若重开 Phase 1，应基于执行记录重新验证而非直接覆写
- 任何 schema 回退都应通过迁移或明确的重建脚本处理

## 11. Final Verification Checklist
- [ ] PostgreSQL 基线已建立
- [ ] Prisma schema 可校验
- [ ] seed 流程可执行
- [ ] shared models 可构建
- [ ] 历史执行记录与本计划对齐

## 12. Approval Request
该 Phase 已作为历史阶段完成归档；仅当需要重开基础设施与数据模型工作时再重新审批。

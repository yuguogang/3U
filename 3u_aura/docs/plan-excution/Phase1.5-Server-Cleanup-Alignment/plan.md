# Plan: Phase 1.5 - Server Cleanup & Model Alignment

## 1. Objective
彻底清理 `apps/server` 中仍然依赖旧 Prisma 模型（如 `Asset`, `Order`, `Exchange` 等）和旧 `common` 导出的历史代码。将后端核心模块与新的 AURA 模型、原子单位（Decimal 78,0）以及新的关系结构完全对齐。

## 2. Scope
- **Purge Legacy Modules**: 删除或重写 `src` 目录下与 AURA 业务无关的逻辑。
- **Type Alignment**: 修复因 `common` 包 Enum/Model 变更导致的导入错误。
- **Precision Hardening**: 确保后端计算逻辑能处理 18+ 位原子单位整数（避免丢精度）。
- **Schema Sync**: 适配 `placementKey` 和 `txHashKey` 等新的唯一性约束。

## 3. Out of Scope
- 实现复杂的二分树体量上卷算法（后续 Phase 推进）。
- 编写完整的 DApp 交互逻辑。

## 4. Current State
- `nest build` 报错 239 个，集中在 `UserService`, `AssetService` 和旧的 Controller。
- 存在大量 `RanFinance` 历史遗留文件。

## 5. Architecture Strategy
1. **Delete-First**: 先删除明确不再需要的文件夹（`asset`, `order`, `exchange` 等）。
2. **Skeleton Fix**: 修复 `app.module.ts` 导入。
3. **Core Refactor**: 调整 `user` 模块适配 `walletAddress` 和 `UserProfile`。

## 6. Milestones

### Milestone 1 — Purge Legacy Modules
- **Goal**: 删除所有非 AURA 核心模块。
- **Actions**: `rm -rf src/asset src/exchange src/order src/ran-finance` 等。
- **Verification**: 报错数量应显著下降。

### Milestone 2 — User Module Alignment
- **Goal**: 适配 `walletAddress` 登录与 `UserProfile` 结构。
- **Actions**: 修改 `user.service.ts`, `user.controller.ts`, 和相关的 DTO。

### Milestone 3 — Common & Prisma Precision Fix
- **Goal**: 适配 `Decimal(78, 0)`。
- **Actions**: 全局搜索并修正金额处理逻辑。

## 7. Next Steps
- 请审批此清理计划。
- 审批后我将开始物理删除旧代码并重新编译。

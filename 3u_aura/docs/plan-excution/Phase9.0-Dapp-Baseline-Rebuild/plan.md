# Plan: Phase 9.0 - DApp Baseline Rebuild

## 1. Objective
在不引入外部 starter repo 的前提下，先把 `apps/dapp` 从旧的套利/理财前端壳子收敛成可继续演进的推广阶段基线：保留可复用的 provider / auth / fetch / UI 基础设施，移除与当前 AURA promotion 业务不匹配的旧页面、旧 API、旧导航和失效 shared 依赖，并恢复 `build / lint / typecheck` 基线。

## 2. Scope
- 盘点并下线旧的 `finance / products / swap / loan / redeem / arbitrage` 相关页面、API、query、store 与文案
- 保留并整理可复用基础设施：
  - `providers`
  - `fetch client`
  - `auth store`
  - `wallet connect`
  - `query client`
  - `ui` 基础组件
- 重建 promotion 导向的 app shell：
  - 统一 layout / metadata / font strategy
  - 新导航与路由骨架
  - promotion 首页或 dashboard 占位页
- 对齐 `packages/common` 当前真实导出，移除失效 import
- 补齐 `apps/dapp` 的最小验证脚本与基线说明
- 把 `Phase9` 明确调整为依赖本阶段完成后再执行

## 3. Out of Scope
- Check-in / claim / NFT / team / pending-placement 的正式业务页面实现
- 复杂团队树图形化
- 最终视觉精修与动画 polish
- 完整 e2e 测试体系
- 重新搭一个新的前端 app 或迁入 `Scaffold-ETH-2` 仓库代码

## 4. Assumptions
- 当前 `apps/dapp` 的旧页面与旧 API 已经与现有 `packages/common` / `apps/server` 不兼容，不能作为 `Phase9` 直接增量开发基座
- 采用“参考 `Scaffold-ETH-2` 的技术组合与分层思路，但不直接引入外部模板代码”的方案
- 可复用部分主要是：
  - `QueryProvider`
  - `Web3Provider`
  - `fetchClient`
  - `auth.store`
  - `queries/auth`
  - `queries/user`
  - `components/ui/*`
- 第一版可接受 promotion 页面只有结构化骨架和 placeholder，不要求业务完成
- 如果 Google Fonts 在离线/CI 环境不稳定，应切到本地或系统字体策略

## 5. Architecture Impact
- `apps/dapp/src/app/*`
- `apps/dapp/src/components/*`
- `apps/dapp/src/api/*`
- `apps/dapp/src/queries/*`
- `apps/dapp/src/store/*`
- `apps/dapp/src/lib/*`
- `apps/dapp/package.json`
- `docs/plan-excution/Phase9-Dapp-Promotion-MVP/plan.md`

## 6. Risks
- 清理过度可能误删仍可复用的 auth / provider / UI 基础层
- 旧页面删除后如果路由骨架没有同步补位，会让 DApp 在中间态不可用
- 若继续保留旧 finance 命名和 promotion 新命名并存，后续评审会长期混乱
- 钱包连接与签名登录若在本阶段被误伤，会拖慢后续所有 Phase9 业务联调
- 字体、metadata、next-intl、wagmi provider 都是全局入口，改动需控制 blast radius

## 7. Milestones

### Milestone 1 — Inventory and freeze the keep/remove boundary
**Goal**
- 明确 `apps/dapp` 哪些模块保留、哪些模块删除或替换，先冻结基线边界

**Affected files/modules**
- `apps/dapp/src/app/*`
- `apps/dapp/src/components/*`
- `apps/dapp/src/api/*`
- `apps/dapp/src/queries/*`
- `apps/dapp/src/store/*`

**Implementation notes**
- 输出 keep/remove 清单并据此实施，不做边删边猜
- 保留 auth / provider / query client / ui primitives
- 删除或替换旧 finance/arbitrage 业务入口

**Risks**
- 边界不清会导致 Phase9.0 和 Phase9 scope 再次混在一起

**Verification commands**
- `pnpm --filter dapp lint`
- `pnpm --filter dapp build`

**Expected outputs**
- 明确只有 promotion 基线相关文件仍留在主路径

**Approval checkpoint**
- no

### Milestone 2 — Rebuild the app shell and global entrypoints
**Goal**
- 重建 promotion 导向的 `layout / metadata / nav / root routes`，去除旧品牌和旧业务文案

**Affected files/modules**
- `apps/dapp/src/app/layout.tsx`
- `apps/dapp/src/app/page.tsx`
- `apps/dapp/src/components/layout/*`
- `apps/dapp/src/components/pages/*`
- `apps/dapp/src/lib/wagmi-config.tsx`

**Implementation notes**
- 新导航只保留 promotion 期需要的骨架入口
- 页面允许 placeholder，但命名、文案、路由必须转正
- 处理字体依赖，避免 build 受外部网络影响

**Risks**
- 全局 layout 改动会影响 next-intl、theme、wallet provider 初始化

**Verification commands**
- `pnpm --filter dapp lint`
- `pnpm --filter dapp build`

**Expected outputs**
- DApp 能以 promotion 壳子正常编译，首页和导航不再暴露旧套利/理财语义

**Approval checkpoint**
- yes

### Milestone 3 — Remove invalid integrations and restore a green baseline
**Goal**
- 去掉失效 shared import、旧 finance API/query/store，补齐最小脚本，使 `dapp` 重新回到可验证状态

**Affected files/modules**
- `apps/dapp/src/api/*`
- `apps/dapp/src/queries/*`
- `apps/dapp/src/store/*`
- `apps/dapp/src/components/wallet-button.tsx`
- `apps/dapp/package.json`

**Implementation notes**
- 对齐 `packages/common` 当前真实 export
- 删除当前无法成立的 finance contract/schema 依赖
- 增加 `typecheck` 脚本；若暂时没有测试，需在计划和执行记录里显式说明

**Risks**
- 登录链路若仍引用旧 enum / schema，会导致 build 假绿但运行时失败

**Verification commands**
- `pnpm --filter dapp lint`
- `pnpm --filter dapp typecheck`
- `pnpm --filter dapp build`

**Expected outputs**
- `apps/dapp` 至少达到 lint / typecheck / build 全通过

**Approval checkpoint**
- yes

### Milestone 4 — Align Phase9 dependency and handoff boundary
**Goal**
- 把 `Phase9` 的实现前提更新成“在本阶段完成后的 promotion baseline 上继续开发”

**Affected files/modules**
- `docs/plan-excution/Phase9.0-Dapp-Baseline-Rebuild/*`
- `docs/plan-excution/Phase9-Dapp-Promotion-MVP/plan.md`

**Implementation notes**
- 明确 `Phase9.0` 只负责基线重建
- 明确 `Phase9` 才开始做：
  - check-in
  - dashboard
  - pending placement
  - NFT / claim

**Risks**
- 如果依赖关系没写清，后续又会把基线修复和业务实现混做

**Verification commands**
- `rg -n "Phase9.0|baseline|pending-placement|promotion" docs/plan-excution/Phase9*`

**Expected outputs**
- `Phase9` 计划对依赖关系和前置状态描述一致

**Approval checkpoint**
- no

## 8. Rollback / Recovery Notes
- 删除旧页面前先保证有新的 root shell 或 placeholder 承接，避免路由全部悬空
- 对可复用基础层优先做保留式重构，不做大爆炸替换
- 如果 wallet/auth 基线在执行中被破坏，应优先恢复 provider 与登录链路，再继续 UI 清理
- 对移除的旧模块保留 git 历史，不做额外归档目录，避免仓库长期带双套前端

## 9. Final Verification Checklist
- [ ] 旧 `finance / arbitrage / loan / redeem / swap` 主路径已清理或替换
- [ ] 新 app shell / nav / home skeleton 已切到 promotion 语义
- [ ] `wallet-button` 与 auth 基线仍可编译
- [ ] `apps/dapp` 与 `packages/common` 当前导出一致
- [ ] `pnpm --filter dapp lint` 通过
- [ ] `pnpm --filter dapp typecheck` 通过
- [ ] `pnpm --filter dapp build` 通过
- [ ] `Phase9` 计划已标明依赖本阶段完成

## 10. Approval Checkpoint
请审批 `Phase9.0-Dapp-Baseline-Rebuild` 计划；审批后再开始清理旧前端并重建 promotion 基线，不直接进入 `Phase9` 业务页面实现。

# Plan: Phase 3 - Referral Tree Binding, Placement & Closure

## 1. Objective
实现推荐关系绑定、二叉树挂载规则、placementKey 与 TeamClosure 维护，为后续体量上卷和奖励计算建立稳定树结构。

## 2. Scope
- inviter / parent / teamPosition 绑定规则
- placementKey 生成与唯一约束应用
- TeamClosure 插入逻辑
- 根节点与 admin root 初始化衔接
- “一旦挂树即冻结”的服务策略
- 绑定 DTO / script / admin repair policy

## 3. Out of Scope
- 体量上卷
- 直推 / 间推奖励
- weekly ranking / NFT 资格
- DApp 团队可视化

## 4. Assumptions
- 不允许更换 parent
- LEFT / RIGHT 只通过 teamPosition 表达
- 不维护 leftChild/rightChild 双写结构
- placementKey 作为父节点同侧唯一性的应用层键

## 5. Current State
- Schema 已支持 parentId、teamPosition、placementKey、TeamClosure
- 尚未有 bind inviter / bind placement 业务规则
- 尚未有 closure 维护与修复脚本

## 6. Target State
- 用户可被稳定挂入树中
- 同一父节点同一侧不会重复挂人
- closure 查询可供后续体量上卷复用
- 树结构事实来源稳定，不需要后补重构

## 7. Architecture Impact
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/tree/*`
- `apps/server/scripts/*`
- `packages/common/src/*`

## 8. Risks
- 树冻结策略不明确导致后续变更 parent
- TeamClosure 插入错误导致全量祖先链错误
- admin root / seed 与生产绑定口径不一致

## 9. Milestones

### Milestone 1 — Binding contracts and service rules
**Goal**
- 定义 inviter / placement 的 DTO、service 规则和冻结策略

**Affected files/modules**
- `apps/server/src/modules/referral/*`
- `packages/common/src/*`

**Implementation notes**
- inviter 绑定与 parent 绑定最好同事务完成
- 明确何时允许“未挂树但已注册”的状态

**Risks**
- 注册时机与挂树时机不一致

**Verification**
- commands:
  - `pnpm --filter server lint`
  - `pnpm --filter server typecheck`
- expected result:
  - DTO / service contracts 明确

**Approval checkpoint**
- no

### Milestone 2 — PlacementKey + TeamClosure maintenance
**Goal**
- 实现 placementKey 唯一保护与 TeamClosure 祖先链维护

**Affected files/modules**
- `apps/server/src/modules/tree/*`
- `apps/server/prisma/*`

**Implementation notes**
- 插入 descendant 时同时插入 self-depth=0 和祖先链
- 失败时整段回滚

**Risks**
- closure 层级错误

**Verification**
- commands:
  - `pnpm --filter server test -- tree`
- expected result:
  - 根、直连、祖先链查询结果正确

**Approval checkpoint**
- yes

### Milestone 3 — Admin guardrails and repair scripts
**Goal**
- 提供只读检查、有限修复脚本与审计约束

**Affected files/modules**
- `apps/server/scripts/*`
- `apps/server/src/modules/audit/*`

**Implementation notes**
- repair 优先只在非生产或初始化阶段使用
- 生产修复必须具备变更审计

**Risks**
- 修复脚本被用作常规写入口

**Verification**
- commands:
  - `pnpm --filter server test -- referral`
- expected result:
  - 非法重复挂载被拒绝，合法初始化通过

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- parent 绑定必须在变更前做强校验
- TeamClosure 生成失败整体回滚
- 修复脚本必须先 dry-run 再 apply

## 11. Final Verification Checklist
- [ ] 同一父节点同一侧唯一
- [ ] 用户一旦挂树即冻结
- [ ] TeamClosure 深度链正确
- [ ] inviter / placement 口径一致
- [ ] repair 流程受限且可审计

## 12. Approval Request
请审批 Phase 3 计划；通过后进入推荐树绑定与 closure 实现。

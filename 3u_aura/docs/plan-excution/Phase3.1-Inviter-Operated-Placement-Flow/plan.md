# Plan: Phase 3.1 - Inviter-Operated Placement, Pending Queue & Selectable Slots

## 1. Objective
在保留 `Phase3` 已完成的推荐绑定与二叉树基础结构前提下，修正挂树流程的操作者与交互语义：直接推荐注册成功后先进入待挂树状态，由 `inviter` 在自己的团队二叉树内选择任意空余 `LEFT/RIGHT` 位置完成挂载，挂载成功后不可撤销。

## 2. Scope
- 将挂树主写入口从“被挂载用户自助提交”调整为“邀请人代其直接推荐提交”
- 明确 `pending placement` 状态与最小可审计事实来源
- 提供 inviter 视角的待挂树列表查询契约
- 提供 inviter 视角的可挂点查询契约
- 保留“父节点必须位于 inviter 子树内”的校验，并明确“可挂任意层级空位”
- 保留“一旦挂树即冻结，仅管理员修复脚本可调整”的约束
- 同步调整 shared contracts / DTO / validators / tests / repair script 边界

## 3. Out of Scope
- 真实消息推送、站内信、短信或链上通知
- DApp 团队树完整可视化界面实现
- 自动 spillover、自动寻位、自动换边
- 体量上卷、推荐奖励、排名或 NFT 资格计算
- 历史已挂树用户的数据迁移脚本

## 4. Assumptions
- 注册成功后仅绑定 `inviterId`，不自动决定 `parentId + teamPosition`
- 只有直接邀请人可以为其直接推荐完成首次挂树
- 挂树目标可以是邀请人本人，也可以是邀请人团队二叉树中的任意层级成员
- 同一父节点同一侧只能存在一个成员
- 一旦 `parentId + teamPosition + placementKey` 写入成功，即视为永久冻结
- 当前阶段不引入真实通知基础设施，待办消息先以查询接口或 read model 暴露

## 5. Current State
- `Phase3` 已完成推荐绑定、`placementKey`、`TeamClosure` 与修复脚本基础能力
- 当前挂树 mutation 的 actor 仍是被挂载用户本人，不符合最新业务口径
- 当前没有 inviter 视角的待挂树列表和可挂点查询
- 当前 execution 记录已经完成，不能直接改写原 `Phase3` 计划来承载本次变更

## 6. Target State
- 新注册用户使用邀请码后，只形成推荐关系并进入待挂树状态
- inviter 可以查询自己名下待挂树的直接推荐列表
- inviter 可以查询自己团队二叉树中的可挂点集合，并显式选择目标 `parentId + teamPosition`
- 服务端保证：只能放置自己的直接推荐；父节点必须位于自己团队树内；目标侧必须空闲；挂树成功后冻结
- 后续 `Phase4+` 可以直接复用该稳定口径进行上卷、奖励、排名和资格计算

## 7. Architecture Impact
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/tree/*`
- `apps/server/src/modules/shared/*`
- `apps/server/scripts/repair-tree-placement.ts`
- `packages/common/src/models/*`
- `packages/common/src/validators/*`

## 8. Risks
- actor 权限边界错误会导致用户可替别的团队挂树
- 可挂点查询如果直接扫描整棵树，后续可能出现性能问题
- 挂点查询与实际落点之间存在并发竞争，必须依赖唯一键和事务回滚兜底
- `pending placement` 如果只用 `parentId is null` 表达，需避免与异常脏数据混淆
- 原有 `Phase3` 自助挂树接口若不妥善处理，会造成双入口口径漂移

## 9. Milestones

### Milestone 1 — Freeze the new business contract
**Goal**
- 冻结“推荐绑定”和“邀请人代挂树”的业务边界，明确谁可以操作、谁只能等待、哪些状态不可逆

**Affected files/modules**
- `docs/plan-excution/Phase3.1-Inviter-Operated-Placement-Flow/*`
- `packages/common/src/models/*`
- `packages/common/src/validators/*`
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/tree/*`

**Implementation notes**
- 保留两条关系并明确职责：
  - `inviterId` 负责推荐关系
  - `parentId + teamPosition` 负责二叉树挂载关系
- 新增或调整共享契约时，优先表达：
  - 待挂树成员列表项
  - 可挂点列表项
  - inviter 发起的挂树命令
- 需要明确当前自助挂树接口的处理策略：
  - 删除
  - 废弃保留但禁止普通用户使用
  - 改为 inviter actor 版本

**Risks**
- 如果 contract 没先冻结，后续 DApp 和 server 会各自发明一套口径

**Verification**
- commands:
  - `pnpm --filter common build`
  - `pnpm --filter server build`
- expected result:
  - shared contract 与 server module 边界清晰，无循环依赖或重复 DTO

**Approval checkpoint**
- no

### Milestone 2 — Pending queue and selectable-slot read models
**Goal**
- 提供 inviter 可消费的“待挂树成员列表”和“团队可挂点列表”读取能力

**Affected files/modules**
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/tree/*`
- `packages/common/src/models/*`
- `packages/common/src/validators/*`

**Implementation notes**
- 待挂树成员列表至少应包含：
  - `userId`
  - `wallet`
  - `registeredAt`
  - `inviterId`
  - `isPlacementPending`
- 可挂点列表至少应包含：
  - `parentId`
  - `teamPosition`
  - `placementKey`
  - `depth`
  - `display path` 或最小定位信息
- 第一版允许只提供后端分页 / 层序查询，不追求一次性返回完整大树
- 若暂不引入独立 `pending status` 字段，则需把“未挂树”与“非法半成品数据”区分开

**Risks**
- 读取接口输出不稳定，会直接拖慢 DApp 的挂树交互
- 可挂点枚举策略不合理，后续会出现大树性能问题

**Verification**
- commands:
  - `pnpm --filter server test -- referral`
  - `pnpm --filter server test -- tree`
- expected result:
  - inviter 只能看到自己的待挂树成员
  - 可挂点列表只覆盖 inviter 子树内的空余位置

**Approval checkpoint**
- yes

### Milestone 3 — Inviter-operated placement mutation
**Goal**
- 把主写路径改成 inviter 为自己的直接推荐选择挂点，并保留冻结与 closure 维护

**Affected files/modules**
- `apps/server/src/modules/tree/*`
- `apps/server/src/modules/referral/*`
- `apps/server/src/modules/shared/*`
- `packages/common/src/validators/*`

**Implementation notes**
- mutation command 至少需要：
  - `placementUserId`
  - `parentId`
  - `teamPosition`
- 核心校验必须覆盖：
  - actor 必须等于 `placementUser.inviterId`
  - `parentId` 必须是 actor 本人或 actor 子树节点
  - 目标侧为空
  - 该用户尚未冻结挂点
- 挂树写路径仍需：
  - 事务化
  - 依赖唯一键兜底并发
  - 更新 `TeamClosure`
  - 写审计
- 对旧的“被挂载用户自助挂树”入口，需要明确迁移策略和兼容行为

**Risks**
- actor 校验缺失会形成严重越权
- 并发抢位可能造成前端看到可挂点但提交时失败

**Verification**
- commands:
  - `pnpm --filter server test -- tree`
  - `pnpm --filter server test -- referral`
  - `pnpm --filter server test`
- expected result:
  - 合法 inviter 可成功挂树
  - 非邀请人无法代挂
  - 已占位、越权、重复挂树、变更挂点全部被拒绝

**Approval checkpoint**
- yes

### Milestone 4 — Admin guardrails, repair and compatibility cleanup
**Goal**
- 对齐 repair script、审计和旧接口清理策略，避免双写入口长期共存

**Affected files/modules**
- `apps/server/scripts/repair-tree-placement.ts`
- `apps/server/src/modules/tree/*`
- `apps/server/src/modules/audit/*`
- `docs/plan-excution/Phase3.1-Inviter-Operated-Placement-Flow/*`

**Implementation notes**
- repair script 继续只用于初始化和异常修复，不得替代正常业务入口
- 若保留旧接口，需要显式返回错误并指向新流程
- 需要把本次调整与原 `Phase3` 的关系记录清楚，避免后续审计误读

**Risks**
- 旧入口残留会造成不同客户端走不同挂树规则

**Verification**
- commands:
  - `pnpm --filter server test -- tree`
  - `pnpm --filter server build`
- expected result:
  - repair 与主写路径职责边界清晰
  - 旧入口不再形成可用双轨

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 任何邀请人代挂树的写路径都必须保留事务边界与唯一键兜底
- 若新入口上线后发现权限问题，应优先关闭新入口并保留只读查询，不回滚已冻结的合法挂点
- 对异常挂树的修复继续通过管理员脚本和审计记录处理，不做静默数据覆盖

## 11. Final Verification Checklist
- [ ] 推荐关系与二叉树关系职责清晰且不混用
- [ ] 直接推荐注册后进入待挂树状态
- [ ] inviter 只能处理自己的直接推荐
- [ ] 可挂点范围覆盖 inviter 子树内任意层级空位
- [ ] 同一父节点同一侧唯一，挂树后冻结
- [ ] 旧自助挂树入口已清理或显式禁用
- [ ] TeamClosure 仍保持正确
- [ ] repair / audit 边界清晰

## 12. Approval Request
请审批 `Phase3.1` 计划；通过后再实现 inviter 代挂树、待挂树列表和可挂点查询，不直接改动已完成的 `Phase3` 历史记录。

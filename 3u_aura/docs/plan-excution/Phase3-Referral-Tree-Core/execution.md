# Execution

## Status
Completed.

## Summary
- 实现了推荐绑定主写路径：用户先通过邀请码绑定 `inviterId`，不在该步骤自动决定左右区。
- 实现了二叉树挂载主写路径：用户单独提交 `parentId + teamPosition` 完成挂载，挂载成功后位置冻结。
- 保持 `inviter` 与 `parent/teamPosition` 解耦，避免把推荐关系和树位置关系混在同一条写路径中。
- 增加树修复脚本，支持 root 初始化和管理员补挂载。

## Implemented
- `packages/common/src/models/promotion.ts`
  - 补充推荐绑定视图和挂载视图字段，明确 `placementKey` 为确定性落点键。
- `apps/server/src/modules/referral/`
  - 增加推荐绑定 controller。
  - 实现推荐绑定 repository / service / policy engine。
  - 保证同邀请码重复提交幂等；已绑定后禁止切换到不同邀请人。
- `apps/server/src/modules/tree/`
  - 增加挂载 controller。
  - 实现挂载 repository / service / policy engine。
  - 校验父节点必须是邀请人本人或邀请人子树节点。
  - 同一父节点同一侧冲突时直接失败，不自动换边。
  - 挂载成功后写入 closure rows，形成后续团队统计的稳定基础。
- `apps/server/scripts/repair-tree-placement.ts`
  - `init-root`：初始化 root 自闭包记录。
  - `bind-placement`：管理员补挂载。

## Commands Run
- `pnpm run build` in `packages/common`
- `pnpm run build` in `apps/server`
- `pnpm run test -- referral` in `apps/server`
- `pnpm run test -- tree` in `apps/server`
- `pnpm run test` in `apps/server`
- `pnpm tsx scripts/repair-tree-placement.ts` in `apps/server`

## Verification Results
- `packages/common` build：通过
- `apps/server` build：通过
- `referral` 定向测试：通过，`3` 个用例全部通过
- `tree` 定向测试：通过，`6` 个用例全部通过
- `apps/server` 全量测试：通过，`6` 个 suite / `16` 个测试全部通过
- `repair-tree-placement.ts`：无参数启动时正确输出 usage，并以非零码退出，符合脚本冒烟预期

## Deviations From Plan
- root 节点初始化没有做成自动流程，改为通过 `repair-tree-placement.ts --mode init-root` 显式执行。
- 运行期审计仍保持在 application seam，不把复杂审计逻辑提前塞进 Phase3 主事务；管理员修复脚本会直接写 `AdminAuditLog`。

## Risks / Follow-up
- 当前只完成主写路径，尚未提供团队树查询或可视化读取接口。
- 当前测试已暴露 Jest worker 退出不够干净的问题，后续如继续扩展模块，建议补查 open handle / timer 清理。
- 左右区规则已经在服务端冻结为显式挂载，后续 Phase4 及以后应复用该口径，不应再引入自动 spillover。

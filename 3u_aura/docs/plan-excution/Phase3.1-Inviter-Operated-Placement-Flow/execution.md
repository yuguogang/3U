# Execution

## Status
Completed.

## Summary
- 挂树主写路径已从“被挂载用户自助提交”调整为“直接邀请人代其提交”。
- 新增 inviter 视角的待挂树成员读取接口。
- 新增 inviter 视角的可挂点读取接口，覆盖 inviter 子树内任意层级空余 `LEFT/RIGHT` 位置。
- 保留 `inviterId` 与 `parentId + teamPosition` 双结构分离，并继续保证挂树后冻结。

## Implemented
- `packages/common/src/models/promotion.ts`
  - 新增待挂树成员视图与可挂点视图。
- `packages/common/src/validators/promotion.ts`
  - `ReferralBindPlacementSchema` 增加 `placementUserId`，把挂树命令正式切换成 inviter 代挂树语义。
- `apps/server/src/modules/referral/*`
  - 新增 `GET /referral/pending-placement`。
  - `ReferralService` / `ReferralRepository` 支持读取当前 inviter 名下待挂树直接推荐。
- `apps/server/src/modules/tree/*`
  - 新增 `GET /tree/placement/selectable-slots`。
  - `POST /tree/placement/bind` 改为 inviter 为其直接推荐选择挂点。
  - 校验 actor 必须等于 `placementUser.inviterId`。
  - 校验父节点必须位于 actor 子树内。
  - 继续使用 `placementKey` 唯一约束与 `TeamClosure` 维护。
- `apps/server/scripts/repair-tree-placement.ts`
  - 改为调用独立的 `repairPlacementForUser`，避免管理员修复路径和业务主入口混用。
- `apps/server/src/auth/*`
  - 增加最小 DTO/类型兼容修复，恢复 `apps/server` build 验证链路。

## Commands Run
- `pnpm run build` in `packages/common`
- `pnpm run build` in `apps/server`
- `pnpm run test -- referral` in `apps/server`
- `pnpm run test -- tree` in `apps/server`
- `pnpm run test` in `apps/server`
- `pnpm tsx scripts/repair-tree-placement.ts` in `apps/server`
- `pnpm exec eslint src/modules/referral src/modules/tree src/auth/controllers src/auth/dto scripts/repair-tree-placement.ts` in `apps/server`

## Verification Results
- `packages/common` build：通过
- `apps/server` build：通过
- `referral` 定向测试：通过，`1` 个 suite / `4` 个测试全部通过
- `tree` 定向测试：通过，`2` 个 suite / `8` 个测试全部通过
- `apps/server` 全量测试：通过，`6` 个 suite / `19` 个测试全部通过
- `repair-tree-placement.ts`：无参数启动时正确输出 usage，并以非零码退出，符合脚本冒烟预期
- 目标范围 `eslint`：通过，无 error；保留测试 mock 的 `no-unsafe-argument` warning

## Deviations From Plan
- 旧的 `POST /tree/placement/bind` 路由没有删除，而是原位切换为 inviter 代挂树语义，避免额外保留双轨 endpoint。
- 当前没有增加真实通知/消息队列；“邀请人收到一条消息”的第一版以后端待挂树读取接口表达，不做 push。
- 为恢复 `apps/server` build，补了 auth DTO 和返回类型声明；这不是 `Phase3.1` 核心业务逻辑，但属于本次验证闭环所需的兼容修复。

## Risks / Follow-up
- DApp 仍需自己消费“待挂树列表 + 可挂点列表”拼装树选择体验，后端暂未提供完整团队树渲染 read model。
- 目前可挂点枚举是按 inviter 子树全量读取构造，用户规模进一步扩大后可能需要分页或层序窗口化策略。
- Jest 仍提示 worker 退出不够干净，说明仓库里还有 open handle / timer 清理问题，后续应单独排查。
- `apps/server/src/auth/services/auth.service.ts` 存在既有 lint 债，本次只做了最小类型补强以保证 build；未把 auth 模块整体清理成独立任务。

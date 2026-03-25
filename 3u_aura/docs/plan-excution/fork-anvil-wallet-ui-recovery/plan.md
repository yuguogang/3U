# Fork-Anvil Wallet UI Recovery

## 1. Objective
恢复 `fork-anvil` 本地 UAT 所需的 DApp/Admin 页面可用性，修复因钱包层编译失败导致的：
- admin 无法连接钱包登录
- `/checkin`、`/nft` 等 DApp 页面异常 404/空白

## 2. Scope
- 修复 `apps/dapp` 与 `apps/admin` 的本地 Web3 provider / wallet UI 编译链路
- 保持 `fork-anvil` 下 injected wallet 手工 UAT 能正常工作
- 清理并重启本地 `fork-anvil` 的 dapp/admin 服务
- 进行针对性 typecheck / build / 路由可用性验证

## 3. Out of Scope
- 不调整奖励、claim、settlement、rewardFunder 业务逻辑
- 不改动链上合约或 server API
- 不引入新的钱包产品能力设计

## 4. Assumptions
- 本次问题根因是 RainbowKit / wagmi 默认导入链将未安装的可选 connector 打进 Webpack，导致 dev 编译失败
- `fork-anvil` 主要需要 injected wallet 支持，不要求本轮恢复全量 RainbowKit 钱包矩阵
- server `3210` 当前健康，可继续复用

## 5. Architecture Impact
- 影响边界仅限前端钱包接入层
- 如果需要，将在 `fork-anvil` / automation 分支下改为最小化 wagmi 配置，避免编译期依赖爆炸
- 保持 UI 层和认证逻辑分离，不把签名/登录业务规则挪入 provider

## 6. Milestones

### Milestone 1: 固化根因并设计最小修复
- goal:
  - 确认触发编译失败的导入链，并选定最小 blast radius 的 provider/wallet 修复方式
- affected files/modules:
  - `apps/dapp/src/lib/wagmi-config.tsx`
  - `apps/admin/src/lib/wagmi-config.tsx`
  - `apps/dapp/src/components/providers/web3-provider.tsx`
  - `apps/admin/src/components/providers/web3-provider.tsx`
  - 视需要扩展到 wallet button 组件
- implementation notes:
  - 优先避免 `getDefaultConfig` / RainbowKit 默认入口带来的可选 connector 依赖
  - 如果需要，`fork-anvil` 环境下切到 injected-only 配置
- risks:
  - 改动过大可能影响现有钱包 UI 交互
- verification commands:
  - `pnpm --dir apps/dapp typecheck`
  - `pnpm --dir apps/admin typecheck`
- expected outputs:
  - 钱包层不再出现模块缺失编译错误

### Milestone 2: 恢复 DApp/Admin 页面与本地服务
- goal:
  - 修复页面可访问性，并确保 admin/dapp 使用正确的 `fork-anvil` 环境启动
- affected files/modules:
  - 上述 provider/wallet 文件
  - `config/promotion-envs/fork-anvil/logs/*`
  - `config/promotion-envs/fork-anvil/services.runtime.json`
- implementation notes:
  - 停掉冲突或旧的 dev 进程后，重新拉起 dapp/admin
  - 用实际路由验证 `/checkin`、`/nft`、admin dashboard`
- risks:
  - 本地旧进程残留导致误判
- verification commands:
  - `curl -I http://127.0.0.1:3200/checkin`
  - `curl -I http://127.0.0.1:3200/nft`
  - `curl -I http://127.0.0.1:3201/dashboard`
- expected outputs:
  - 目标路由返回 200/重定向而非 404

### Milestone 3: 手工 UAT 恢复确认
- goal:
  - 确认 admin 可连钱包登录，dapp 可进入签到与 NFT 页面
- affected files/modules:
  - 无新增代码模块，主要是运行态验证
- implementation notes:
  - 保持“CI 自动，UAT 手工”
  - 我负责恢复环境和给出操作提示，用户继续手工点验
- risks:
  - 浏览器钱包扩展上下文本身异常会继续影响 admin 登录
- verification commands:
  - `pnpm --dir apps/dapp build`
  - `pnpm --dir apps/admin build`
  - 本地页面手工验证
- expected outputs:
  - 页面恢复，用户能继续本轮 UAT

## 7. Approval Checkpoint
获得用户批准后再实施代码修改和服务重启。

## 8. Rollback / Recovery Notes
- 若最小钱包修复方案影响现有 UI，可回退相关 provider/wallet 改动
- 若 dev 服务仍异常，可重新执行 `fork-anvil` dapp/admin 重启流程
- 不触碰 server / contracts / DB 数据

## 9. Final Verification Checklist
- `apps/dapp` 钱包层无编译期缺失依赖错误
- `apps/admin` 钱包层无编译期缺失依赖错误
- `/checkin`、`/nft`、admin dashboard 恢复可访问
- admin 可连接钱包并进入签名登录流程
- `execution.md` 记录真实修复步骤、命令、结果

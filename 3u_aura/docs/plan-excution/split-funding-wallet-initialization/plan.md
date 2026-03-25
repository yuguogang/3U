# Split Funding Wallet Initialization

## 1. Objective

将奖励资金来源按运营口径初始化为独立地址，并在本地 `fork-anvil` / 后续测试环境中形成可重复的部署与验证流程：

- 抽奖/排名 `USDT` 奖励资金来源：`checkinReceiverAddress`
- NFT 周补贴资金来源：`financeWallet`

目标不是只在文档中约定，而是让环境初始化、manifest、部署脚本和测试步骤都真正按该职责拆分。

## 2. Scope

### 2.1 In Scope

- 为本地/测试环境引入独立的钱包角色：
  - `owner`
  - `rootPublisher`
  - `settlementPublisher`
  - `checkinReceiverAddress`
  - `rewardFunderAddress`
  - `financeWallet`
- 调整环境初始化脚本、manifest 生成和 `fork-anvil` 启动默认值
- 必要时重部署本地测试合约，使 `rewardFunderAddress` 与 `financeWallet` 指向新地址
- 补齐本地测试资金准备逻辑：
  - 给用户钱包补测试 `mUSDT`
  - 给 `checkinReceiverAddress / rewardFunderAddress` 准备抽奖/排名奖励资金
  - 给 `financeWallet` 准备周补贴资金
- 完成 `fork-anvil` 下的重新准备与验证说明

### 2.2 Touched Modules

- `config/promotion-envs/fork-anvil/*`
- `scripts/promotion-env/*`
- `scripts/ci/lib/*`
- `scripts/uat/*`
- `apps/contracts/script/*`
- `config/promotion-envs/*/manifest.json`（如需要同步模板/样例）

## 3. Out of Scope

- 不在本轮重新设计 `rewardFunder` 合约接口
- 不改变抽奖/排名/周补贴业务规则
- 不把 AURA 安慰奖改成链上 claim
- 不在生产环境直接切换地址角色

## 4. Assumptions

### 4.1 Business Assumptions

- 签到收款与抽奖/排名奖资金来源应归属于同一运营池，因此 `rewardFunderAddress` 默认与 `checkinReceiverAddress` 对齐
- NFT 售卖收款与每周补贴资金来源应归属于另一运营池，因此 `financeWallet` 独立存在
- 本地测试允许直接给这些资金地址补 `mUSDT`，不要求所有资金都通过完整业务流自然沉淀

### 4.2 Technical Assumptions

- 当前合约与后台能力已经支持 `rewardFunderAddress` 从独立地址出资
- `fork-anvil` 可通过重新部署和重写 manifest 来完成角色拆分
- 用户侧测试钱包 `0x3C44...93BC` 仍将作为主要手工 UAT 账号

### 4.3 Risk Assumptions

- 该任务涉及资金角色、环境初始化和测试资金准备，属于 `Critical`
- 如果只改 manifest 不重置本地环境，容易出现“配置已拆分、链上还是旧状态”的不一致
- 如果脚本默认钱包未同步更新，后续 UAT 会再次出现“钱包有权限但没资金”的误判

## 5. Architecture Impact

### 5.1 Current State

- 当前 `fork-anvil` manifest 中：
  - `checkinReceiverAddress`
  - `financeWallet`
  - `rewardFunderAddress`
  都指向同一个地址 `0xf39F...2266`
- 这会让本地测试误以为 NFT 售卖收入与抽奖/排名奖资金来源是同一池资金

### 5.2 Target State

- 环境初始化后，角色明确拆分为：
  - `checkinReceiverAddress = rewardFunderAddress != financeWallet`
  - `financeWallet` 独立
  - `owner/rootPublisher/settlementPublisher` 可继续保持管理员控制地址，是否独立视测试便利性决定
- `fork-anvil` 重新部署后：
  - `MerkleClaim.rewardFunder` 指向新的 `checkinReceiverAddress`
  - `NFTSale.financeWallet` 指向新的 `financeWallet`
- 本地测试资金准备分成三条：
  - 用户操作资金
  - 抽奖/排名奖资金
  - 周补贴资金

## 6. Milestones

### 6.1 Milestone A: Role Split Design For Local/Test Environments

#### goal

确定本地/测试环境中每个地址角色的初始化方案和来源策略。

#### affected files/modules

- `config/promotion-envs/fork-anvil/manifest.json`
- `scripts/promotion-env/lib.mjs`
- `scripts/ci/lib/manifest.mjs`

#### implementation notes

- 先固定一套测试角色映射，优先使用 Anvil 默认测试账号
- 明确哪些地址只负责配置，哪些地址需要实际持有 `mUSDT`
- 输出角色表，避免脚本再隐式回退为同一地址

#### risks

- 角色表不清晰会导致脚本继续复用旧地址

#### verification commands

- `node --check scripts/promotion-env/lib.mjs`
- `node --check scripts/ci/lib/manifest.mjs`

#### expected outputs

- 一套明确的角色拆分映射
- manifest/环境推导逻辑接受该映射

### 6.2 Milestone B: Fork-Anvil Initialization And Redeploy

#### goal

让 `fork-anvil` 真正按拆分地址初始化并重部署合约。

#### affected files/modules

- `config/promotion-envs/fork-anvil/*`
- `scripts/promotion-env/deploy-contract-suite.mjs`
- `scripts/ci/lib/anvil.mjs`
- `scripts/uat/*`

#### implementation notes

- 重置 `fork-anvil`
- 用新的角色映射重部署合约
- 确认新的：
  - `rewardFunderAddress`
  - `checkinReceiverAddress`
  - `financeWallet`
  已体现在 manifest 和链上部署参数中

#### risks

- 本地 runtime manifest 和 config manifest 漂移
- 重部署后旧的测试状态失效，需要重新 prepare

#### verification commands

- `PROMOTION_ENV=fork-anvil pnpm promotion-env:fork:reset`
- 相关部署输出检查
- `cat config/promotion-envs/fork-anvil/manifest.json`

#### expected outputs

- 本地 `fork-anvil` 环境角色已拆分
- 合约参数与 manifest 保持一致

### 6.3 Milestone C: Funding Preparation Flows

#### goal

把三类资金准备逻辑拆清楚并自动化。

#### affected files/modules

- `scripts/uat/run-weekly-fork-scenarios.mjs`
- `scripts/uat/*`
- 视需要新增资金准备 helper

#### implementation notes

- 用户钱包 `93BC`：直接补测试 `mUSDT`
- `checkinReceiverAddress/rewardFunderAddress`：补足抽奖/排名奖注资所需 `mUSDT`
- `financeWallet`：补足 NFT 周补贴注资所需 `mUSDT`
- 若要做更贴近真实业务的流，也可额外提供“通过签到生成沉淀资金”的路径，但不作为本轮唯一方案

#### risks

- 若只补用户钱包，仍无法完成发奖测试
- 若只补 funder，不补用户钱包，买 NFT/签到仍会失败

#### verification commands

- `cast call ... balanceOf(...)`
- 相关 UAT prepare 脚本执行

#### expected outputs

- 三类资金地址余额可独立验证
- 后续 UAT 不再因为“谁该有钱”而混乱

### 6.4 Milestone D: Manual UAT Re-run

#### goal

在拆分地址后的环境中重新完成一次奖励与 NFT 相关手工测试。

#### affected files/modules

- `docs/plan-excution/.../execution.md`
- `config/promotion-envs/fork-anvil/weekly-reward-scenario.state.json`

#### implementation notes

- 重新准备场景
- 验证：
  - check-in 支付
  - NFT 购买
  - 抽奖/排名奖 funding/publish/claim
  - NFT 周补贴 funding/claim

#### risks

- 如果 admin/dapp 本地运行态仍不稳定，UAT 会被前端问题阻塞

#### verification commands

- 手工浏览器验证
- 必要的 `cast call` / admin preview 检查

#### expected outputs

- 拆分地址模型在本地环境真实跑通

## 7. Approval Checkpoint

获得用户批准后，再开始修改环境初始化、重部署和测试脚本。

## 8. Rollback / Recovery Notes

- 若拆分后本地环境不可用，可重新执行 `fork-anvil` reset 回到当前单地址模式
- 保留旧 manifest 备份，避免脚本/配置不可逆覆盖
- 不在未经确认的情况下影响 `testnet-live` 或生产配置

## 9. Final Verification Checklist

- `checkinReceiverAddress` 与 `financeWallet` 在环境中真实拆分
- `rewardFunderAddress` 指向 `checkinReceiverAddress`
- `NFTSale.financeWallet` 链上参数正确
- `MerkleClaim.rewardFunder` 链上参数正确
- 用户钱包、签到奖池、周补贴资金池余额可分别验证
- `fork-anvil` 下重新完成一轮关键手工 UAT
- `execution.md` 记录真实改动、命令与结果

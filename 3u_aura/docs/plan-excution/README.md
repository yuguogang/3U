# 3U AURA 后继任务计划包（基于已完成 Phase 1）

本压缩包用于承接：

- 已完成的 `Phase 1 - Infrastructure & Data Models`
- 3U AURA 合并版规范中的推广阶段 MVP 与发行后阶段规划

## 目录说明

- `docs/plan-excution/00-Roadmap-After-Phase1/`
  - 总路线图、依赖关系、审批顺序
- `docs/plan-excution/Phase1-Infrastructure-Data-Models/`
  - 已完成阶段的 plan / execution 归档
- `docs/plan-excution/Phase2-Checkin-Accounting/`
  - 签到、支付回执、内部账本、资金池拆分
- `docs/plan-excution/Phase3-Referral-Tree-Core/`
  - 推荐树绑定、closure、placement、规则冻结
- `docs/plan-excution/Phase4-Volume-Propagation-Rewards/`
  - 上卷体量、直推/间推奖励、小区指标、NFT 资格与签名服务边界
- `docs/plan-excution/Phase5-Weekly-Epoch-Ticketing/`
  - 周期、门票、滚存、资格判断
- `docs/plan-excution/Phase6-Lottery-Ranking-Merkle/`
  - 抽奖、排名、安慰奖、Merkle 数据管道
- `docs/plan-excution/Phase7-Contracts-NFT-Core/`
  - FounderNFT / NFTSale
- `docs/plan-excution/Phase8-Contracts-Settlement-Claim/`
  - Settlement / MerkleClaim / 编码对齐
- `docs/plan-excution/Phase9-Dapp-Promotion-MVP/`
  - 推广阶段 DApp 页面与交互
- `docs/plan-excution/Phase10-Token-Launch-Transition/`
  - 发行总 claim、上线切换、停用推广逻辑、claim 接口冻结
- `docs/plan-excution/Phase11-Token-Tax-Dividend-Burn/`
  - 上线后 DEX 交易税、分红、回购/销毁、烧池
- `docs/plan-excution/Phase12-Ops-QA-Security-Release/`
  - 联调、审计清单、发布门禁

## 推荐执行顺序

1. 审批 `00-Roadmap-After-Phase1/plan.md`
2. 审批并执行 `Phase2` → `Phase6`
3. 审批并执行 `Phase7` → `Phase8`
4. 审批并执行 `Phase9`
5. 联合审批 `Phase10` + `Phase11`
6. 先冻结 launch-ready token / claim interface，再执行 `Phase10` 切换与 `Phase11` 上线后税逻辑验证
7. 最后进行 `Phase12`

## 为什么这么拆

这个拆法遵循两个原则：

1. 先把**推广阶段 MVP**跑通
   - 每日签到 3 USDT
   - 1000 AURA 内部账本
   - 两级推荐奖励
   - 连签 7 天门票
   - 每周抽奖与排名
   - Founder NFT 购买 / 推广型资格 mint
   - 每周 30U 购买型 NFT 补贴
2. 再进入**发行切换与纯交易阶段**
   - 推广奖励永久停止
   - 发行总 claim
   - DEX 交易税
   - 分红与烧池

## 使用方式

每个 Phase 目录都已经包含：

- `plan.md`
- `execution.md`

请保持：
- 未审批前不要进入实现
- 实现后将真实命令、测试结果、偏差与补救记录到 `execution.md`

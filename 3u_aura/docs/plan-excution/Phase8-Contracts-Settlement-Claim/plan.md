# Plan: Phase 8 - Contracts Settlement, MerkleClaim & Server Encoding Alignment

## 1. Objective
实现 Settlement 与 MerkleClaim 合约，并与 server 的 epoch / leaf 编码管道完成对齐。

## 2. Scope
- Settlement epoch accounting
- 购买型 NFT 每周 30U Pull-claim
- 最长不超过 3 个月的补贴边界
- MerkleClaim 合约
- server ↔ contract 的 leaf 编码 golden sample
- 测试、脚本、接口对齐
- owner / publisher / finance wallet 权限边界冻结

## 3. Out of Scope
- AURA Token
- DEX 税 / 分红
- 链上随机抽奖

## 4. Assumptions
- 每周 30U 补贴只对购买型 NFT 生效
- 推广阶段补贴在代币上 DEX 后永久停止
- MerkleClaim 只用于推广阶段 weekly USDT claim
- 当前 Phase8 跟随 Phase6 已落地口径：MerkleClaim 仅覆盖抽奖/排名 USDT；安慰奖 AURA 继续留在内部账本，Phase10 统一 genesis claim
- 发行总 claim 单独在 Phase 10 处理
- Settlement 不依赖 server 持仓快照做领取人判断，链上以 `epoch + tokenId` 为唯一 claim 键，领取时按 NFT 当前 owner 校验
- golden sample 的 leaf 编码字段冻结为 `address account + uint8 rewardTypeCode + uint256 amount`

## 5. Current State
- server 将在 Phase 6 生成 epoch / leaf / root 草稿
- 尚无 Settlement / MerkleClaim 合约
- contracts 当前已有 `FounderNFT / NFTSale`
- server 侧 weekly merkle draft 已固定 rewardTypeCode: `LOTTERY=1 / RANKING=2`

## 6. Target State
- 购买型 NFT 持有者可按周期 claim 30U
- 每周抽奖/排名的 leaf root 可在本地测试中成功 claim
- 编码实现单一口径，避免链下链上漂移
- Settlement 与 MerkleClaim 都只暴露最小可审计管理接口，不引入隐式遍历或复杂批处理

## 7. Architecture Impact
- `apps/contracts/src/Settlement.sol`
- `apps/contracts/src/MerkleClaim.sol`
- `apps/contracts/test/*`
- `apps/contracts/script/*`
- `packages/common/*`（如需共享 leaf 编码常量）

## 8. Risks
- epoch 编号对不上
- leaf 编码不一致导致 claim 全失败
- NFT 每周补贴与 NFT 持仓关系校验错误
- 重复 claim 防护不严
- owner 与 publisher 权限混淆导致 root / epoch 被错误发布
- 如果不冻结“当前 owner 领取”口径，NFT 转移后的补贴归属会持续歧义

## 9. Milestones

### Milestone 1 — Settlement claim model
**Goal**
- 实现购买型 NFT 的 epoch 补贴 claim

**Affected files/modules**
- `apps/contracts/src/Settlement.sol`
- `apps/contracts/test/Settlement*`

**Implementation notes**
- 不遍历全体 NFT
- 以 epoch + tokenId / holder 为 claim 边界
- 需要明确采用 `epoch + tokenId` 去重，而不是 `epoch + owner`
- 领取时按 `FounderNFT.ownerOf(tokenId)` 校验当前 owner，避免依赖链下持仓镜像
- 仅 `isPurchasedNFT(tokenId)` 可领取周补贴

**Risks**
- epoch 切换与重复 claim

**Verification**
- commands:
  - `forge test --match-path test/Settlement*`
- expected result:
  - 每 NFT 每 epoch 只能 claim 一次，边界条件正确

**Approval checkpoint**
- yes

### Milestone 2 — MerkleClaim implementation
**Goal**
- 实现 weekly reward Merkle claim

**Affected files/modules**
- `apps/contracts/src/MerkleClaim.sol`
- `apps/contracts/test/MerkleClaim*`

**Implementation notes**
- 参考 Uniswap distributor 思路
- claimed bitmap / index protection 要严谨
- 叶子编码必须与 Phase6 server 保持一致：`account + rewardTypeCode + amount`
- rewardTypeCode 至少冻结 `1=LOTTERY_USDT`、`2=RANKING_USDT`

**Risks**
- proof 验证与重复领取

**Verification**
- commands:
  - `forge test --match-path test/MerkleClaim*`
- expected result:
  - valid proof 成功，重复 claim / 错 proof 失败

**Approval checkpoint**
- yes

### Milestone 3 — Golden sample alignment
**Goal**
- 固化 server 与 contracts 共用的 leaf 编码样例与回归测试

**Affected files/modules**
- `apps/contracts/test/*`
- `apps/server/tests/*`
- `packages/common/*`（如需）

**Implementation notes**
- 必须有样例 leaf / root / proof 文件供双端回归
- 如果需要共享常量，只共享 `rewardTypeCode` 与编码顺序，不共享具体 proof 数据生成逻辑
- golden sample 应包含至少 1 条 lottery 和 1 条 ranking leaf，避免单类型通过但混合类型漂移

**Risks**
- 一处修改 hash 规则导致双端错位

**Verification**
- commands:
  - `pnpm --filter server test -- merkle`
  - `forge test --match-path test/MerkleClaim*`
- expected result:
  - 相同样例在 server 与 contract 侧完全一致

**Approval checkpoint**
- yes

## 10. Rollback / Recovery Notes
- 合约与 server 编码规则必须先用 golden sample 锁定
- 若编码修改，必须同时修改双端测试样例
- 若 Settlement 的 owner 归属口径需要调整，必须在实现前改计划，不接受实现后再靠脚本补口径

## 11. Final Verification Checklist
- [ ] 购买型 NFT 每周 30U claim 正确
- [ ] 补贴最长 3 个月边界清晰
- [ ] MerkleClaim proof / duplicate 防护正确
- [ ] MerkleClaim 仅覆盖 lottery / ranking USDT，与 Phase6 server 输出一致
- [ ] server 与 contract leaf 编码一致
- [ ] Settlement 领取口径已冻结为 `epoch + tokenId`，并按当前 token owner 校验
- [ ] 双端回归样例已固化

## 12. Approval Request
请审批 Phase 8 计划；通过后进入 Settlement / MerkleClaim 合约实现与双端对齐。

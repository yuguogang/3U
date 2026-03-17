# Purchased NFT Flow - 手工 UAT Bug 记录 (Phase 9.4)

本文档记录在 `fork-anvil` 环境下，根据 `GUIDE.md` 进行“直接购买 NFT”流程时发现的前端和数据流 Bug。

---

### Bug 1: UI 状态在 `approve` 后未自动更新

-   **现象 (Symptom):** 在 `/nft` 页面，用户点击 "Approve 1000 USDT" 并成功确认交易后，"Buy Purchased NFT" 按钮依然是灰色不可点击状态。
-   **复现步骤 (Reproduction):**
    1.  进入 `/nft` 页面。
    2.  点击 "Approve 1000 USDT"。
    3.  在钱包中确认交易。
    4.  观察到 "Buy Purchased NFT" 按钮状态未改变。
-   **临时解决方案 (Workaround):** 手动刷新页面后，"Buy Purchased NFT" 按钮变为可点击状态。
-   **期望结果 (Expected Result):** `approve` 成功后，"Buy" 按钮应自动变为可点击状态，无需刷新。

---

### Bug 2: 购买成功后后端数据未自动同步

-   **现象 (Symptom):** 用户成功购买 NFT（链上交易成功，供应量减少）后，后端的 `nftHolding` 表没有自动创建对应的持仓记录。
-   **复现步骤 (Reproduction):**
    1.  清空 `nftHolding` 表中的测试数据。
    2.  在 DApp 上成功购买一个 NFT。
    3.  查询 `nftHolding` 表，发现没有新的记录被插入。
-   **根本原因 (Root Cause):** DApp 前端在链上交易成功后，未能自动触发对后端 `/api/v1/claims/purchased-nft/sync` 接口的调用。
-   **期望结果 (Expected Result):** 购买成功后，DApp 应自动调用同步接口，将持仓数据写入后端数据库。

---

### Bug 3: DApp 缺少已持有 NFT 的展示区域

-   **现象 (Symptom):** 在 `/nft` 页面，即使用户已经通过购买或奖励获得了 NFT（并且后端数据库已有记录），页面上也没有一个专门的区域来展示“我拥有的 NFT”列表。
-   **复现步骤 (Reproduction):**
    1.  确保用户已持有 NFT（通过链上查询或数据库查询）。
    2.  访问 `/nft` 页面。
    3.  观察到页面只显示购买和推荐资格部分，没有显示已持有的 NFT。
-   **期望结果 (Expected Result):** 页面上应该有一个明确的区域，例如 "My NFTs" 或 "我的持仓"，来展示用户当前拥有的 NFT 列表及其详情。

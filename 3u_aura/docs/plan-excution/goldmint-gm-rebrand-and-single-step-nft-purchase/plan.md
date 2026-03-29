# Plan: Goldmint / $GM Rebrand And Single-Step NFT Purchase

## 1. Objective
将 `apps/dapp` 的可见品牌从 `3U AURA` 调整为 `Goldmint / $GM`，并基于用户提供的 logo、移动端风格参考图、NFT 卡牌视觉图，重塑 DApp 的视觉表达；同时分析并落地“购买卡牌时授权与支付合并为一次钱包确认”的可行方案。

该任务属于 `Critical`：
- 品牌改造会跨越文案、主题、图标、NFT 页面与导航壳层。
- 购买链路改造直接涉及 `ERC20 -> NFTSale` 支付路径、合约接口、钱包签名次数与部署配置。

## 2. Scope
- 将 DApp 的头部品牌、元信息、favicon/icon、主要用户可见文案从 `AURA / 3U` 切换为 `Goldmint / $GM`
- 基于用户提供的视觉素材，重构移动端壳层、首页卡片、NFT 页面主视觉与购买卡牌展示
- 明确现有 NFT 购买为什么需要两次钱包确认，并给出可实施的“单次确认”方案
- 如果选择“真正单次确认”，补齐合约、前端 ABI、部署配置、测试计划与回滚方案
- 保持 server / dapp / contracts / env wiring 的一致性，避免出现“前端文案改了但链上名字和部署脚本未对齐”的状态

## 3. Out of Scope
- 不在本任务内重命名数据库表、Prisma model、历史 ledger/claim 数据中的内部枚举值
- 不在本任务内重做团队树、奖励、claim、check-in 的业务规则
- 不在本任务内把所有旧 broadcast 历史文件批量重写为 `$GM`
- 不在未审批的前提下直接改线上/测试网部署地址
- 不在本任务内引入新的后台审批流程，除非“单次确认购买”方案最终需要额外后端参与并被明确批准

## 4. Assumptions
- 用户希望“用户可见品牌”优先切换为 `Goldmint`，代币名显示为 `$GM`
- 用户提供的 3 张参考图作为第一版视觉方向：
  - 金币 logo：用于 app 品牌、icon、局部徽章视觉
  - 紫色移动端示例：用于信息层次、入口卡片、移动端运营化布局参考
  - GM 盾牌卡图：用于 NFT/卡牌页主视觉与购买卡片风格参考
- 最新新增的 GM 参考图优先级更高，作为主视觉基线：
  - 奶油白 / 浅米色大理石底
  - 拉丝金色卡片与圆形金属徽章
  - 棕金色顶部/底部导航
  - 浮雕/压印感边框、轻拟物高光与阴影
  - 整体偏“贵金属金融产品”而不是赛博紫或深蓝科技感
- 当前链上 NFT 购买路径是：
  - 前端先 `approve(paymentToken, nftSale, purchasePrice)`
  - 再调用 `NFTSale.buyNFT()`
- 当前支付代币接口仅支持最小 ERC20 能力，不支持 `permit`
- 若要做到“真正一次钱包确认完成购买”，大概率需要链上接口改造，而不是只改前端按钮交互

## 5. Current State
- DApp 壳层头部仍写死 `3U` 与 `AURA`：
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/app/layout.tsx`
  - `apps/dapp/src/app/icon.svg`
- 设计系统仍围绕 `aura-*` 变量与 `night/day/aura` 三套主题命名：
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/app/layout.tsx`
- 多语言文案里有大量 `AURA HUB`、`Total Accumulated AURA`、`Founder NFT` 等用户可见文案：
  - `apps/dapp/messages/*/common.json`
- NFT 页面当前是两段式购买：
  - `handleApprove()` 调 `erc20.approve(...)`
  - `handleBuy()` 调 `nftSale.buyNFT()`
  - 文件：`apps/dapp/src/components/pages/nft-page.tsx`
- 合约 `NFTSale.buyNFT()` 直接执行 `paymentToken.transferFrom(msg.sender, financeWallet, PURCHASE_PRICE)`，天然依赖预先 allowance：
  - `apps/contracts/src/NFTSale.sol`
- 当前 `IERC20Minimal` 与 `MockUSDT` 都没有 `permit`：
  - `apps/contracts/src/interfaces/IERC20Minimal.sol`
  - `apps/contracts/src/mocks/MockUSDT.sol`
- 相比之下，check-in 是单笔 `transfer()`，因此只需一次确认：
  - `apps/dapp/src/components/pages/checkin-page.tsx`
- 当前 DApp 只读取价格、allowance、余额、剩余数量等链上状态，还没有 NFT `tokenURI/metadata` 读取链路：
  - `apps/dapp/src/hooks/use-promotion-contract-state.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`
- 部署与环境配置仍使用 `3U AURA Founder NFT / 3UAURA`：
  - `config/promotion-envs/*/manifest.json`
  - `config/promotion-envs/*/contracts.public.env`
  - `scripts/promotion-env/deploy-contract-suite.mjs`
  - `apps/contracts/script/DeployNFTCore.s.sol`

## 6. Architecture Impact

### DApp Branding / Visual System
- `apps/dapp/src/app/layout.tsx`
- `apps/dapp/src/app/icon.svg`
- `apps/dapp/src/app/globals.css`
- `apps/dapp/src/components/layout/mobile-layout.tsx`
- `apps/dapp/src/components/pages/dashboard-page.tsx`
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/messages/*/common.json`
- `apps/dapp/public/images/*`（新增 GM logo / card visual / fallback assets）

### Purchase Flow
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `apps/dapp/src/hooks/use-promotion-contract-state.ts`
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/src/interfaces/IERC20Minimal.sol`
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/test/NFTSale.t.sol`
- `apps/contracts/test/NFTSignature.t.sol`（如沿用 EIP712/permit 风格）

### Deployment / Configuration
- `config/promotion-envs/testnet-mockusdt/manifest.json`
- `config/promotion-envs/testnet-live/manifest.json`
- `config/promotion-envs/uat-mockusdt/manifest.json`
- `config/promotion-envs/*/contracts.public.env`
- `scripts/promotion-env/deploy-contract-suite.mjs`
- `apps/contracts/script/DeployNFTCore.s.sol`

## 7. Implementation Options For “一次密码购买”

### Option A — True Single Confirmation Via Permit-Like Payment Authorization
**What changes**
- 为支付代币补充 `permit` 能力，或替换为支持 `permit` 的支付代币
- `NFTSale` 增加 `buyNFTWithPermit(...)`，在单次交易内完成 allowance 授权和 `buyNFT`
- 前端从两按钮改为单按钮，签名/交易参数一次提交

**Pros**
- 真正达到“授权 + 支付 = 一次钱包确认”
- UX 与用户预期最一致
- 逻辑仍保持链上可审计、原子执行

**Cons**
- 需要修改合约接口、测试、ABI、部署与地址配置
- 若当前生产/测试支付代币不是可控合约，则无法靠前端单独完成
- 已部署 `NFTSale`/`MockUSDT` 大概率需要重新部署或新增版本

**Assessment**
- 这是唯一能稳定满足“只输一次密码完成购买”的高可信方案
- 推荐作为目标方案，但前提是用户接受合约与部署变更

### Option B — Keep Existing ERC20 Approval Model, Only Reduce Friction
**What changes**
- UI 只展示一个“购买”入口
- 若 allowance 不足，提示先授权；若 allowance 足够，则直接购买
- 可选做“大额/无限授权一次，后续购买单次确认”

**Pros**
- 不改链上模型，风险低
- 对现有部署兼容最好

**Cons**
- 首次购买仍然至少两次钱包确认
- 不能满足用户提出的“像 3U 一样一次密码即可支付”

**Assessment**
- 可以作为保守回退方案，但不能作为本需求的最终承诺

### Option C — Replace Purchase With Direct Transfer + Off-Chain/Server Sync
**What changes**
- 仿照 check-in，用钱包直接 `transfer(financeWallet, amount)` 支付
- 后端/脚本监听 txHash，再确认并触发 mint/登记

**Pros**
- 表面上可做到单笔支付交易
- 前端实现简单

**Cons**
- 会把当前“支付与 mint 原子完成”的链上闭环拆开
- 对资金审计、重试幂等、异常恢复、链上证据一致性都更差
- 与当前 `NFTSale` 架构方向相冲突

**Assessment**
- 不推荐
- 除非业务明确接受“支付成功但 NFT mint 需异步补偿”的模型，否则不应采用

## 8. Recommended Direction
- 品牌/UI：直接执行 `Goldmint / $GM` 重塑，包含 logo、文案、主题与 NFT 页面主视觉调整
- 购买链路：以 `Option A` 作为推荐目标方案，`Option B` 作为保守回退方案
- 不建议采用 `Option C`
- 视觉风格以最新参考图为准：
  - 页面底色走浅色大理石纹理
  - 主卡片走拉丝金属金面板
  - 导航与钱包区走深棕金属条
  - icon/按钮走圆形金币压印风
  - 避免继续沿用现有 `night/day/aura` 中偏红、偏蓝、偏霓虹的视觉语言

### 8.1 Detailed Design Supplement

#### App Visual Language
- App 壳层采用“财富终端”风格，而不是泛 Web3 发光面板：
  - 背景：奶油白 / 米白大理石纹理，局部用浅金渐变切片增强层次
  - 顶部 / 底部导航：深棕金属条，带细金线与高光压边
  - 主要内容卡：拉丝金属金卡 + 象牙白信息区
  - CTA 按钮：圆形金币或椭圆压印按钮，避免扁平纯色按钮
  - 图标：优先使用金币、盾牌、印章、财富凭证语义，弱化赛博感电路荧光
- 参考图映射方式：
  - 金币 logo 图：用于品牌主标、按钮徽章、购买确认区的信任锚点
  - 紫色移动端图：只借信息分区与快捷入口密度，不继承配色
  - 蓝金盾牌卡图：用于 NFT 卡牌主视觉与收藏品识别，不直接扩散为全站主配色
- 建议的基础色板：
  - `bg-shell`: `#f6efe3` 到 `#efe3cf`
  - `panel-gold`: `#c79a43` / `#e6c46e` / `#8a5a1f`
  - `panel-brown`: `#4c3422`
  - `text-title`: `#352315`
  - `text-body`: `#6c523d`
  - `accent-enamel`: `#1f4f78` 到 `#163a59`，仅用于 NFT 卡牌内部蓝釉面

#### NFT / NFA Card Product Definition
- 技术上继续使用 `ERC721 / NFT` 作为标准资产模型。
- `NFA` 建议仅作为产品层命名，例如：
  - 页面标题：`Goldmint Founder NFA Card`
  - 合约与 ABI：仍保持 `NFT` 术语，避免和市场标准脱轨
- 推荐把卡牌区分为两层：
  - `Collection Layer`：链上真实 NFT，负责所有权、tokenId、supply、baseURI
  - `Presentation Layer`：DApp 内部“卡牌正面 / 背面 / 详情”呈现模型

#### NFT Front / Back / Detail Structure
- 正面 `Front`：
  - 大面积收藏主视觉图
  - `Goldmint / $GM` 标识、卡名、稀有度、token serial、购买价
  - `Purchased` 与 `Referral` 使用不同角标或徽章，不建议完全不同 UI 架构
- 背面 `Back`：
  - 权益说明、持有规则、链信息、发行批次、合约短地址、品牌印章
  - 更适合做“卡背说明 + 可信信息”而不是再次放大正面大图
- 详情 `Detail`：
  - 独立详情抽屉或页面
  - 展示大图、属性、tokenId、mint 方式、mint 时间、相关 claim/subsidy 信息
  - 若后续接入奖励权益，可继续承载“本卡可领收益 / 已领取状态”

#### Metadata And Asset Placement
- 合约层：
  - `FounderNFT` 只维护 `baseURI` 与 token ownership，不在链上存大图片或背面详情 JSON
  - 当前 `FounderNFT.setBaseURI(...)` 已满足元数据入口需求
- 元数据层：
  - 推荐用标准 NFT JSON 作为主格式，媒体资源放 IPFS 或可控 CDN
  - 标准字段保留市场兼容性：
    - `name`
    - `description`
    - `image`
    - `attributes`
    - `external_url`
- DApp 扩展字段：
  - 推荐放到 `properties.goldmint` 之下，而不是把大量自定义字段平铺到顶层
  - 示例结构：

```json
{
  "name": "Goldmint Founder Card #12",
  "description": "Goldmint founder access card.",
  "image": "ipfs://.../front.png",
  "external_url": "https://app.goldmint.vip/nft/12",
  "attributes": [
    { "trait_type": "Tier", "value": "Founder" },
    { "trait_type": "Mint Type", "value": "Purchased" }
  ],
  "properties": {
    "goldmint": {
      "back_image": "ipfs://.../back.png",
      "detail_image": "ipfs://.../detail.png",
      "theme": "blue-shield-gold-core",
      "rarity": "Founder",
      "badge_text": "FOUNDING ACCESS",
      "surface_style": "brushed-gold-and-blue-enamel",
      "utility_summary": [
        "Founder purchase right",
        "Weekly subsidy eligibility",
        "Referral identity proof"
      ]
    }
  }
}
```

#### DApp Consumption Strategy
- 第一阶段推荐增加一个轻量 metadata adapter：
  - 先读取链上 `tokenURI` / `baseURI`
  - 再读取 JSON 里的标准字段与 `properties.goldmint`
  - 若 metadata 暂未就绪，DApp 回退到本地默认素材与默认文案
- 本地 fallback 建议只负责：
  - 默认 front/back/detail 图
  - 默认卡名、默认权益摘要
  - 购买态 / 推荐态视觉兜底
- 不建议把全部卡牌内容硬编码在前端，否则后续换图或新增卡类都要重新发版

#### Purchased vs Referral Variant Strategy
- 当前链上已存在 purchased/referral 两种 mint 来源，应在视觉上体现但不要做成两个完全不同产品：
  - `Purchased NFT`：主标更偏金色核心、财富凭证感
  - `Referral NFT`：保留蓝金盾牌语义，更像身份勋章 / 成长勋章
- 若后续需要精确区分视觉版本：
  - 短期可由后端同步结果或 metadata 字段给前端
  - 中期可在 DApp 侧补充读取 `isPurchasedNFT(tokenId)` 或配套 API 映射

#### Compatibility Principle
- 任何面向 OpenSea/钱包/NFT 市场的主展示，优先依赖标准 `image + attributes`
- 正反翻转与详情增强属于 DApp 私有体验，不应破坏通用 NFT 元数据兼容性
- 因此：
  - 市场兼容依赖标准字段
  - Goldmint 专属交互依赖 `properties.goldmint`
  - 合约继续保持 ERC721 标准，不做“NFA 特殊标准”分叉

## 9. Risks
- 用户可见品牌改名若误伤内部稳定标识，可能导致迁移成本扩大：
  - 例如 `LedgerAssetType.AURA`、`RewardType.CONSOLATION_AURA` 等共享枚举
- 如果修改 `SIGNING_NAME`、NFT collection name/symbol 或部署参数，已有签名、地址、广播脚本与环境配置都要重新对齐
- 若支付代币不受控或没有 `permit`，将无法实现真正单次确认购买
- 若在 UI 改造中直接替换大量结构，可能影响移动端可读性与现有查询卡片布局
- 若合约升级后不补充完整 `forge test` 回归，容易在 allowance、重放保护、失败路径上出现回归

## 10. Milestones

### Milestone 1 — Brand Inventory And Design System Mapping
**Goal**
- 明确哪些 `AURA/3U` 属于用户可见品牌，哪些属于内部稳定标识，形成 `$GM / Goldmint` 替换边界

**Affected files/modules**
- `apps/dapp/src/app/layout.tsx`
- `apps/dapp/src/app/icon.svg`
- `apps/dapp/src/app/globals.css`
- `apps/dapp/src/components/layout/mobile-layout.tsx`
- `apps/dapp/messages/*/common.json`
- `config/promotion-envs/*/manifest.json`

**Implementation notes**
- 先盘点品牌分层：
  - 壳层标题、logo、favicon、metadata
  - 国际化文案
  - 页面主视觉和插图
  - 链上 collection name / symbol / signing domain
- 明确第一期只改“用户可见层”，还是包含“链上 collection identity”
- 用用户给的 4 张图形成第一版 moodboard，并以最新 dashboard 参考图为最高优先级：
  - 金币 GM 用于品牌识别
  - 紫色运营感布局只借结构，不照抄配色
  - 盾牌卡图用于 NFT 视觉卡牌方向
  - 最新 dashboard 图用于主题配色、材质、边框与导航样式

**Risks**
- 用户可见品牌与链上元数据混改，会造成阶段性不一致

**Verification commands**
- `rg -n "AURA|3U|Founder NFT|3UAURA" /Users/ygg/vs/ai/3U/3u_aura/apps/dapp /Users/ygg/vs/ai/3U/3u_aura/apps/contracts /Users/ygg/vs/ai/3U/3u_aura/config -g '!**/.next/**'`

**Expected outputs**
- 一份明确的品牌替换边界
- 一套可执行的视觉方向与资产接入点清单

### Milestone 2 — DApp Shell And Content Rebrand
**Goal**
- 完成 DApp 公共壳层、metadata、icon、基础主题与多语言品牌文案改造

**Affected files/modules**
- `apps/dapp/src/app/layout.tsx`
- `apps/dapp/src/app/icon.svg`
- `apps/dapp/src/app/globals.css`
- `apps/dapp/src/components/layout/mobile-layout.tsx`
- `apps/dapp/messages/*/common.json`
- `apps/dapp/public/images/*`

**Implementation notes**
- 用 GM logo 替换头部 `3U` 圆角徽章与 app icon
- 主题重构为 Goldmint 风格：
  - 奶油白大理石底纹
  - 拉丝金色金属质感
  - 深棕金属导航条
  - 更接近最新参考图的信息层次、卡片厚度与轻拟物质感
- 保留现有组件层级，优先改 tokens / shell / content 文案，避免不必要的大拆大建

**Risks**
- 多语言文案替换范围较大，容易漏词
- 若只改中文未改其他 locale，会造成混合品牌体验

**Verification commands**
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `curl --max-time 10 -I http://127.0.0.1:3100`

**Expected outputs**
- DApp 外壳统一展示 `Goldmint / $GM`
- logo / icon / 标题 / 主题色与参考图方向一致

### Milestone 3 — NFT/Card Page Visual Redesign
**Goal**
- 将 NFT 页面从占位式卡片改成带品牌主视觉的 Goldmint 卡牌购买页

**Affected files/modules**
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/components/ui-custom/*`
- `apps/dapp/public/images/*`
- `apps/dapp/messages/*/common.json`

**Implementation notes**
- 用用户提供的盾牌卡牌图作为购买卡的主视觉资源或切图参考
- NFT 市场页与首页风格需统一到同一套 Goldmint 材质语言：
  - 首页偏“仪表盘/财富面板”
  - NFT 页偏“收藏卡/贵金属凭证”
- 优化购买信息层级：
  - 卡牌名称
  - 价格
  - 当前余额
  - 剩余数量
  - 权益说明
  - 购买状态反馈
- 若进入卡牌增强方案，需一并补：
  - front/back/detail 的组件骨架
  - metadata adapter 或本地 fallback 配置
  - purchased/referral 徽章与视觉区分规则
- 若图片较大，需补静态资源压缩与移动端裁切策略

**Risks**
- 若直接内嵌大图且不优化，会影响移动端首屏性能
- 卡牌视觉替换后，按钮区与状态提示可能需要同步重排

**Verification commands**
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- 手工检查 `/nft` 在 390px 左右视口下的首屏与滚动表现

**Expected outputs**
- NFT 页面具备 Goldmint 卡牌视觉与更强的购买转化表达

### Milestone 4 — Single-Step Purchase Technical Decision
**Goal**
- 锁定“单次确认购买”最终采用的技术路径，并确认是否需要合约升级

**Affected files/modules**
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/src/interfaces/IERC20Minimal.sol`
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/test/NFTSale.t.sol`

**Implementation notes**
- 先验证支付代币控制权与 `permit` 可行性
- 若 token 可改：
  - 进入 `Option A`
- 若 token 不可改：
  - 明确告知只能做 `Option B`，无法承诺“首次购买单次确认”
- 该里程碑结束后再进入具体实现

**Risks**
- 在未锁定技术路径前就动前端，会导致界面承诺与链上能力不一致

**Verification commands**
- `rg -n "permit|approve|buyNFT|transferFrom" /Users/ygg/vs/ai/3U/3u_aura/apps/contracts /Users/ygg/vs/ai/3U/3u_aura/apps/dapp -g '!**/dist/**'`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test --match-contract NFTSaleTest`

**Expected outputs**
- 一个被批准的技术选型结论：`Option A` 或 `Option B`

### Milestone 5 — Purchase Flow Implementation
**Goal**
- 按批准方案改造 NFT 购买交互与链上能力

**Affected files/modules**
- `apps/dapp/src/components/pages/nft-page.tsx`
- `apps/dapp/src/lib/promotion-contracts.ts`
- `apps/contracts/src/NFTSale.sol`
- `apps/contracts/src/interfaces/IERC20Minimal.sol`
- `apps/contracts/src/mocks/MockUSDT.sol`
- `apps/contracts/test/NFTSale.t.sol`
- `config/promotion-envs/*/manifest.json`
- `scripts/promotion-env/deploy-contract-suite.mjs`

**Implementation notes**
- 若 `Option A`：
  - 设计 `buyNFTWithPermit(...)`
  - 更新 ABI、前端单按钮流程、等待回执与 sync-back
  - 必要时更新 mock token 和部署脚本
- 若 `Option B`：
  - 统一入口按钮文案与流程引导
  - 支持 allowance 已满足时单击直购
  - 明确首次购买仍需授权

**Risks**
- `Option A` 需要重新部署 sale/token，环境接线与测试覆盖必须完整
- `Option B` 容易被误解为“已实现单次确认”，文案必须准确

**Verification commands**
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `cd /Users/ygg/vs/ai/3U/3u_aura/apps/contracts && forge test`

**Expected outputs**
- 购买卡牌链路与批准方案一致，用户交互与链上行为一致

### Milestone 6 — End-To-End Verification And Deployment Notes
**Goal**
- 验证品牌改造与购买链路在本地/目标环境可用，并写清部署与回滚步骤

**Affected files/modules**
- `docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/*`
- 如需要，`config/promotion-envs/*`

**Implementation notes**
- 记录：
  - 本地验证截图点位
  - 购买流程 happy path / failure path / retry path
  - 是否需要重新部署地址
  - 是否需要重发前端静态资源
- 对合约变更保留旧地址与新地址的切换说明

**Risks**
- 若没有明确的部署/回滚步骤，品牌与购买链路会难以安全上线

**Verification commands**
- `pnpm run local:testnet:print:dapp`
- `pnpm run local:testnet:print:server`
- `curl --max-time 10 -sS http://127.0.0.1:3110/api/v1/health`
- 手工验证 `/`, `/team`, `/nft`

**Expected outputs**
- 一份完整的实现验证记录
- 可执行的上线与回滚说明

## 11. Approval Checkpoint
在开始实现前，需要你确认以下关键方向：

1. 品牌替换范围
- 是否只改 DApp 用户可见层为 `Goldmint / $GM`
- 还是连 NFT collection name / symbol / 签名域名一起改

2. 购买链路目标
- 是否接受为实现“真正一次钱包确认”而进行合约改造与重新部署
- 如果不接受合约/部署改动，则只能退回 `Option B`

3. 视觉方向
- 是否以“奶油白大理石 + 拉丝金卡 + 棕金导航 + GM 金币/盾牌卡”作为第一版设计基线

4. NFT / NFA 命名与元数据结构
- 是否同意“链上仍为 NFT 标准，页面文案可使用 NFA 作为产品名”
- 是否同意采用 `标准 NFT metadata + properties.goldmint 扩展字段` 的结构来承载 front/back/detail

5. 卡牌分型
- 是否接受 `Purchased` 与 `Referral` 走同一产品家族、不同徽章和副视觉，而不是拆成两套完全不同卡种

未完成上述确认前，不进入实现阶段。

## 12. Rollback / Recovery Notes
- DApp 品牌回滚：
  - 回退 `apps/dapp` 的 logo / theme / 文案文件即可恢复旧视觉
- 若仅做前端改造，不影响链上状态
- 若执行 `Option A` 并改动合约：
  - 保留旧 `NFTSale` / token 地址与 manifest 记录
  - 通过 env/manifest 切回旧地址
  - 不在未完成回归测试前替换正式环境地址
- 若新购买路径出现问题：
  - 前端先回退到原 `approve + buyNFT` 双步骤
  - 合约保留旧入口作为安全后备，直到新路径稳定

## 13. Final Verification Checklist
- DApp metadata、icon、header、主要页面标题已替换为 `Goldmint / $GM`
- 提供的 logo / card visual 已被正确接入且移动端显示稳定
- 所有启用 locale 的关键品牌词已同步更新
- NFT 页面视觉与购买状态反馈已完成重构
- 若采用 `Option A`：
  - 支付 token / sale contract / ABI / tests / env 已对齐
  - 首次购买真实只需一次钱包确认
- 若采用 `Option B`：
  - 文案明确告知首次授权限制
  - allowance 已满足时购买链路只需一次确认
- `pnpm --dir apps/dapp lint` 通过
- `pnpm --dir apps/dapp typecheck` 通过
- `forge test` 通过
- `execution.md` 已记录真实执行、命令、验证结果和偏差

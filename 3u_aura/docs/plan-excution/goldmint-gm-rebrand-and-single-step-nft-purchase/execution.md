# Execution

## Status
Implementation in progress. UI / branding phase is in second-pass refinement; purchase-flow contract changes not started.

## Last Updated
2026-03-30 12:07:43 +0800

## Summary
- 已完成品牌/UI 与 NFT 购买链路的代码调研。
- 已确认当前“购买卡牌两次密码”的直接原因是 `approve + buyNFT(transferFrom)` 两段式 ERC20 支付模型。
- 已确认若要“真正一次钱包确认完成购买”，需要走合约级方案，而不是只改前端按钮。
- 已根据用户新增参考图，调整视觉方向为“奶油白大理石 + 拉丝金属卡片 + 棕金导航”的 Goldmint 风格。
- 已补充 NFT / NFA 卡牌的正面、背面、详情结构设计，以及 metadata 落点方案。
- 已确认当前 DApp 尚无 NFT `tokenURI/metadata` 消费链路，若要做卡牌增强需要新增 adapter 或 fallback 配置。
- 已完成 DApp 第一轮 `Goldmint / $GM` 前端重塑：
  - 全局主题改为奶油白 / 棕金 / 拉丝金属语言
  - 新增 `Goldmint` 徽章与蓝金盾牌卡视觉组件
  - 改造移动端头部、底部导航、钱包按钮、首页与 NFT 页面
  - 同步多语言可见品牌词到 `Goldmint / $GM`
- 已完成第二轮 NFT 购买区与卡牌细化：
  - 购买区从浅金玻璃感改为深铜底座 + 亮金铭牌组合
  - `GoldmintShieldCard` 补齐 front / back / detail 三态结构
  - 卡牌新增更厚的外金属框、暗色内凹槽、卡背权益板、详情规格板
  - 顶部 toolbar 进一步压深为铜棕金属风格
  - 修复 header `overflow-hidden` 导致顶部弹层被裁切的问题
- 已完成第三轮首页 / NFT 视觉细修：
  - 首页 hero 改为更强的金属主面板，功能入口卡改为更厚的铭牌卡片
  - NFT 正面卡新增编号铭牌、侧边压条与更明显的中心金章
  - 顶部 toolbar 与 wallet pills 再压深一层铜棕色
- 已修复登录期 referral 自绑定导致整次登录失败的问题：
  - 当 referral code 指向用户自己时，自动绑定会跳过，不再阻断登录
  - 保留普通 inviter 绑定校验，不放开手动绑定规则
- 本轮未改动合约、ABI、部署或单次确认购买逻辑；购买链路仍保持现有 `approve + buyNFT` 模型。

## Research Completed
- 盘点了 DApp 品牌入口：
  - `apps/dapp/src/app/layout.tsx`
  - `apps/dapp/src/app/icon.svg`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/messages/*/common.json`
- 盘点了 NFT 购买链路：
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - `apps/contracts/src/NFTSale.sol`
  - `apps/contracts/src/interfaces/IERC20Minimal.sol`
  - `apps/contracts/src/mocks/MockUSDT.sol`
  - `apps/contracts/test/NFTSale.t.sol`
- 盘点了部署与链上品牌入口：
  - `config/promotion-envs/testnet-mockusdt/manifest.json`
  - `scripts/promotion-env/deploy-contract-suite.mjs`
- 复核了 NFT 元数据承载能力与前端读取现状：
  - `apps/contracts/src/FounderNFT.sol`
  - `apps/dapp/src/hooks/use-promotion-contract-state.ts`
  - `apps/dapp/src/lib/promotion-contracts.ts`
- 复核了用户提供的视觉参考图，并据此补充设计语言：
  - 金币 logo 图
  - 紫色移动端信息架构图
  - 蓝金盾牌卡牌图
- 已完成第一轮前端实现：
  - `apps/dapp/src/app/layout.tsx`
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/app/icon.svg`
  - `apps/dapp/src/components/branding/goldmint-emblem.tsx`
  - `apps/dapp/src/components/branding/goldmint-shield-card.tsx`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/ui-custom/glass-card.tsx`
  - `apps/dapp/src/components/ui-custom/stat-card.tsx`
  - `apps/dapp/src/components/ui-custom/bottom-nav.tsx`
  - `apps/dapp/src/components/wallet-button.tsx`
  - `apps/dapp/src/components/pages/dashboard-page.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - `apps/dapp/messages/*/common.json`
- 已完成第二轮视觉细化：
  - `apps/dapp/src/app/globals.css`
  - `apps/dapp/src/components/layout/mobile-layout.tsx`
  - `apps/dapp/src/components/branding/goldmint-shield-card.tsx`
  - `apps/dapp/src/components/pages/nft-page.tsx`
  - `apps/dapp/messages/*/common.json`

## Commands Run
- `rg -n "AURA HUB|AURA|3U|Founder NFT|NFT|card|mint|purchase|approve|allowance|permit|paymentToken|nftSale|buy" apps/dapp apps/contracts apps/server packages/common -g '!**/dist/**'`
- `sed -n '1,220p' apps/dapp/src/components/layout/mobile-layout.tsx`
- `sed -n '1,260p' apps/dapp/src/components/pages/dashboard-page.tsx`
- `sed -n '1,520p' apps/dapp/src/components/pages/nft-page.tsx`
- `sed -n '140,240p' apps/dapp/src/components/pages/checkin-page.tsx`
- `sed -n '1,280p' apps/contracts/src/NFTSale.sol`
- `sed -n '1,260p' apps/contracts/src/mocks/MockUSDT.sol`
- `sed -n '1,240p' apps/contracts/src/interfaces/IERC20Minimal.sol`
- `sed -n '1,260p' apps/contracts/test/NFTSale.t.sol`
- `sed -n '1,240p' config/promotion-envs/testnet-mockusdt/manifest.json`
- `sed -n '1,220p' scripts/promotion-env/deploy-contract-suite.mjs`
- `sed -n '1,220p' apps/contracts/src/FounderNFT.sol`
- `sed -n '1,260p' apps/dapp/src/hooks/use-promotion-contract-state.ts`
- `sed -n '1,260p' apps/dapp/src/lib/promotion-contracts.ts`
- `rg -n "tokenURI|baseURI|image|attributes|metadata|ipfs|back_image|detail_image|nft metadata" apps/dapp apps/server packages/common -g '!**/.next/**' -g '!**/dist/**'`
- `date '+%Y-%m-%d %H:%M:%S %z'`
- `sed -n '1,220p' /Users/ygg/.codex/skills/ui-ux-pro-max/SKILL.md`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "luxury fintech metallic gold mobile dashboard" --domain style`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "luxury elegant gold brown cream" --domain color`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "wealth dashboard mobile card hierarchy" --domain product`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "layout responsive animation accessibility" --stack nextjs`
- `sed -n '1,320p' apps/dapp/src/app/globals.css`
- `sed -n '1,260p' apps/dapp/src/components/layout/mobile-layout.tsx`
- `sed -n '1,320p' apps/dapp/src/components/pages/dashboard-page.tsx`
- `sed -n '1,420p' apps/dapp/messages/en/common.json`
- `sed -n '1,420p' apps/dapp/messages/zh/common.json`
- `sed -n '1,260p' apps/dapp/src/components/ui-custom/glass-card.tsx`
- `sed -n '1,260p' apps/dapp/src/components/ui-custom/stat-card.tsx`
- `sed -n '1,260p' apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- `sed -n '1,260p' apps/dapp/src/components/wallet-button.tsx`
- `sed -n '260,520p' apps/dapp/src/components/pages/nft-page.tsx`
- `rg -n "AURA HUB|AURA|3U AURA|Founder NFT|3UAURA|Promotion Dashboard|Promotion / NFT|Promotion / Team|Promotion / Rewards|Promotion / Check-In" apps/dapp/messages apps/dapp/src -g '!**/.next/**'`
- `node --input-type=module -e '<locale common.json patch script>'`
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp typecheck`
- `git status --short`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "luxury metallic brushed bronze gold plaque" --domain style`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "fintech luxury gold bronze" --domain color`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "luxury certificate plaque card premium fintech" --domain product`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "luxury serif premium fintech" --domain typography`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux`
- `sed -n '1,260p' apps/dapp/src/components/branding/goldmint-shield-card.tsx`
- `sed -n '1,360p' apps/dapp/src/components/pages/nft-page.tsx`
- `sed -n '260,520p' apps/dapp/src/components/pages/nft-page.tsx`
- `sed -n '1,260p' apps/dapp/src/components/pages/dashboard-page.tsx`
- `sed -n '1,220p' apps/dapp/src/components/ui-custom/glass-card.tsx`
- `sed -n '1,220p' apps/dapp/src/components/ui-custom/stat-card.tsx`
- `sed -n '1,260p' apps/dapp/src/components/layout/mobile-layout.tsx`
- `sed -n '520,640p' apps/dapp/src/app/globals.css`
- `sed -n '500,560p' apps/dapp/messages/en/common.json`
- `sed -n '500,560p' apps/dapp/messages/zh/common.json`
- `sed -n '500,560p' apps/dapp/messages/zh-Hant/common.json`
- `sed -n '500,560p' apps/dapp/messages/ja/common.json`
- `sed -n '500,560p' apps/dapp/messages/ko/common.json`
- `sed -n '500,560p' apps/dapp/messages/vi/common.json`
- `curl -I http://127.0.0.1:3100`
- `agent-browser open http://127.0.0.1:3100/nft`
- `agent-browser snapshot -i`
- `agent-browser screenshot`
- `agent-browser screenshot --full`
- `agent-browser click @e3`
- `agent-browser click @e4`
- `agent-browser click @e11`
- `agent-browser click @e16`
- `date '+%Y-%m-%d %H:%M:%S %z'`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "premium metal plaque dark bronze brushed gold app" --domain style`
- `python3 /Users/ygg/.codex/skills/ui-ux-pro-max/scripts/search.py "black gold bronze premium app" --domain color`
- `sed -n '240,520p' apps/dapp/src/components/pages/dashboard-page.tsx`
- `sed -n '1,220p' apps/dapp/src/components/ui-custom/bottom-nav.tsx`
- `sed -n '1,220p' apps/dapp/src/components/notifications/notification-inbox-entry.tsx`
- `sed -n '320,520p' apps/dapp/src/components/branding/goldmint-shield-card.tsx`
- `pnpm --dir apps/server test -- auth.service.spec.ts`
- `pnpm --dir apps/server exec tsc --noEmit`
- `sed -n '1,280p' apps/server/src/auth/services/auth.service.ts`
- `sed -n '1,240p' apps/server/src/auth/services/auth.service.spec.ts`
- `sed -n '1,220p' apps/server/src/modules/referral/engines/referral-policy.engine.ts`
- `sed -n '1,220p' apps/server/src/modules/referral/services/referral-onboarding.service.ts`
- `sed -n '1,220p' apps/dapp/src/api/auth.ts`
- `sed -n '1,220p' apps/dapp/src/queries/auth.query.ts`

## Verification Results
- 当前 NFT 购买前端确实分为 `approve` 与 `buyNFT` 两个独立钱包写操作。
- 当前 `NFTSale.buyNFT()` 依赖 `paymentToken.transferFrom(...)`，因此没有 allowance 时不可能只靠前端完成单次确认。
- 当前 `MockUSDT` 不支持 `permit`，当前最小 ERC20 接口也未暴露 `permit`。
- 当前 check-in 为单笔 `transfer`，所以它的“一次确认”不能直接等价套到 NFT 购买。
- 当前 `FounderNFT` 已有 `setBaseURI(...)` 能力，适合承载标准 NFT metadata，但当前 DApp 未消费这条链路。
- 推荐以 `标准 NFT metadata + properties.goldmint` 扩展字段来承载 front/back/detail，同时保留 NFT 市场兼容性。
- `pnpm --dir apps/dapp typecheck` 通过。
- `pnpm --dir apps/dapp lint` 通过，未引入新增 error；当前仍保留仓库既有 2 个 warning：
  - `apps/dapp/src/components/pages/team-page.tsx` 的 `@next/next/no-img-element`
  - `apps/dapp/src/components/wallet-button.tsx` 的 `react-hooks/exhaustive-deps`
- 新的视觉实现已覆盖：
  - 全局金属主题 token
  - 金币徽章 app icon / header brand
  - 首页财富面板风格
  - NFT 页的金属铭牌购买区与蓝金盾牌卡面
  - 多语言可见品牌文案
- 第二轮细化后再次确认：
  - `pnpm --dir apps/dapp typecheck` 通过。
  - `pnpm --dir apps/dapp lint` 通过，仍只有仓库既有 2 个 warning，无新增 error。
  - 本地页面可正常打开：`http://127.0.0.1:3100/nft`
  - 新版 NFT 购买区已切换为深铜底座视觉，front / back / detail 三态均已落地。
  - 顶部更多菜单弹层已验证可完整显示，不再被 header 裁切。
- 第三轮细化后再次确认：
  - `pnpm --dir apps/dapp typecheck` 通过。
  - `pnpm --dir apps/dapp lint` 通过，仍只有仓库既有 2 个 warning，无新增 error。
  - 最新首页 hero、功能入口与 NFT 卡正面已切换到更强的铜金金属层次。
  - `agent-browser screenshot --full` 已复核首页与 NFT 页面视觉结果。
- 登录兜底修复已确认：
  - `pnpm --dir apps/server test -- auth.service.spec.ts` 通过，新增“self-binding 不阻断登录”的单测。
  - `pnpm --dir apps/server exec tsc --noEmit` 通过。

## Deviations From Original Plan
- 基于用户当前明确批准的是“金属铭牌风格可以开始做”，本轮先执行了 `Milestone 2` 与 `Milestone 3` 的前端部分。
- `Milestone 4/5` 中涉及合约改单次确认购买、ABI、部署与测试的内容未开始，因为用户尚未单独确认“接受合约级改造与重部署”。

## Next Required Action
- 向用户展示本轮前端结果，并确认是否继续细修 `Goldmint` 金属风格细节。
- 若用户确认继续做“一次确认购买”，再进入合约方案审批与实现。

## Incremental Update — 2026-03-30 12:50:47 +0800
- 新增隔离预演页 `apps/dapp/src/app/gm-preview/page.tsx`，在不改正式 dashboard / NFT 页面结构的前提下，先生成 5 类核心视觉元素供用户过目：
  - 金属铭牌徽章
  - 暖白大理石底纹
  - 光泽放射金属卡
  - 哑光主卡 + 发光 3D 数字
  - 透明金属框状态卡
- 已使用本地 DApp dev server 直接打开 `http://127.0.0.1:3100/gm-preview` 并截图，供后续视觉确认。
- 截图产物：
  - `/Users/ygg/.agent-browser/tmp/screenshots/screenshot-2026-03-30T04-49-38-654Z-6oa2xt.png`
  - `/Users/ygg/.agent-browser/tmp/screenshots/screenshot-2026-03-30T04-50-06-091Z-5xosiq.png`

### Commands Run (Incremental)
- `date '+%Y-%m-%d %H:%M:%S %z'`
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `agent-browser open http://127.0.0.1:3100/gm-preview`
- `agent-browser snapshot -i`
- `agent-browser screenshot --full`
- `agent-browser screenshot`
- `git status --short`

### Verification Results (Incremental)
- `pnpm --dir apps/dapp typecheck` 通过。
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- 预演页可正常打开，适合在正式改 dashboard 前先审阅金属/大理石/卡片语言。
- 当前更适合作为“视觉方向确认板”，不是最终像素级成品；用户确认后再把元素拆入正式页面组件。

## Incremental Update — 2026-03-30 Asset Sourcing Checklist
- 新增素材筹备清单文档：`docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/artifacts-checklist.md`
- 文档明确了首页高还原所需的 6 类关键素材：
  - 大理石背景
  - Hero 拉丝金属底板
  - 放射拉丝统计卡底板
  - 金属徽章图标
  - 3D 发光数字
  - 透明金属框卡边缘资源
- 文档同步记录了可用的免费/低风险来源与建议协作模式，便于后续按素材驱动重构首页。

## Incremental Update — 2026-03-30 Asset Shortlist Batch 01
- 新增第一批候选素材文档：`docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/artifacts-shortlist-batch-01.md`
- 已为首页第一阶段重构挑出 4 类候选来源：
  - 大理石背景
  - Hero 拉丝金属底板
  - 放射拉丝统计卡底图
  - 金属徽章参考
- 文档内已标注每类 `Recommended Pick` 与备选链接，便于用户先做小批量确认，再进入素材接入与页面重构阶段。

## Incremental Update — 2026-03-30 Asset Selection Checkpoint
- 用户已初步确认：
  - `Marble: A` → `Unsplash Augustine Wong white marble photo`
  - `Hero: A` → `cgbookcase Brushed Gold 01`
- `Stat` 仍待定。
- 用户提供的“多圆盘金属球”素材已分析：
  - 不适合直接作为 `Stat` 圆角矩形卡片底图
  - 更适合作为 `Badge / coin / plus button` 的材质与形体参考
- 已在 shortlist 文档中补充当前选择状态与这一判断，便于后续继续补充 `Stat` 候选。

## Incremental Update — 2026-03-30 Marble Source Adjustment
- 按用户补充资料，已将首页大理石背景首选切换为：
  - `Unsplash Augustine Wong white marble photo`
  - `https://unsplash.com/photos/a-close-up-of-a-white-marble-surface-li0iC0rjvvg`
- 同步在 shortlist 文档中注明：
  - 该素材更适合做整页背景 `cover`
  - 不应按“无缝平铺贴图”使用
- `ambientCG Marble005 / Marble019` 现保留为工程化备选。

## Incremental Update — 2026-03-30 Stat Candidate Clarification
- 已进一步澄清 `Stat` 候选的使用方式：
  - `TextureCan 423` 可继续保留为第一候选，但只使用其 `Plane` 平面材质逻辑，不使用球体渲染图本身。
  - 新增更平面的备选：
    - `ambientCG Metal051A`
    - `ambientCG Metal051B`
    - 高对比备选 `ambientCG Metal051C`
- shortlist 文档现已明确区分：
  - `球体预览图` 只作为材质展示
  - `真正落到页面的素材` 应是平面 radial brushed metal

## Incremental Update — 2026-03-30 Dashboard-Style Preview Refresh
- 已将 `apps/dapp/src/app/gm-preview/page.tsx` 从“元素陈列板”改为更接近正式首页结构的独立样本页。
- 当前样本页方向：
  - 整页使用暖白大理石背景（按用户确认改为 `Unsplash` 方向）
  - hero 采用 `Hero A` 的拉丝金属语言
  - `Stat` 卡采用更平面化的 radial brushed metal 表现
  - `Badge / plus button` 吸收金属球面素材的徽章质感
- 该路由仍是独立预览页，不影响正式业务页面。

### Commands Run (Preview Refresh)
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `lsof -i :3100`
- `kill -9 50389`
- `pnpm dev`
- `lsof -i :3000`
- `kill -9 29366`
- `PORT=3100 pnpm dev`

### Verification Results (Preview Refresh)
- `pnpm --dir apps/dapp typecheck` 通过。
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- DApp 预览服务已按 `3100` 端口重新拉起，可直接访问 `/gm-preview` 查看样本。

## Incremental Update — 2026-03-30 3D Metal Rim Preview Pass
- 继续在独立预览页 `apps/dapp/src/app/gm-preview/page.tsx` 上细化三类卡片与徽章的 3D 金属感：
  - 为 `hero`、`stat`、`transparent` 三类卡片增加独立金属边框层
  - 新增 `MetalFrame` 包装器，统一实现外金属圈、内凹圈、顶部高光线、底部暗边线
  - 强化 `CoinBadge`，加入图标阴影层、反射高光层与主图层，模拟压铸徽章感
- 本轮仍只作用于 `/gm-preview`，不影响正式首页。

### Commands Run (3D Rim Pass)
- `pnpm --dir apps/dapp typecheck`
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`

### Verification Results (3D Rim Pass)
- `pnpm --dir apps/dapp typecheck` 通过。
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- 预览页现在具备更明确的“3D 外框”与“立体徽章”层级，适合继续对比参考图做下一轮微调。

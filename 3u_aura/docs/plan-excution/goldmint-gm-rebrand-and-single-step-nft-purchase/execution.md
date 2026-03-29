# Execution

## Status
Implementation in progress. UI / branding phase completed; purchase-flow contract changes not started.

## Last Updated
2026-03-29 17:31:04 +0800

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

## Deviations From Original Plan
- 基于用户当前明确批准的是“金属铭牌风格可以开始做”，本轮先执行了 `Milestone 2` 与 `Milestone 3` 的前端部分。
- `Milestone 4/5` 中涉及合约改单次确认购买、ABI、部署与测试的内容未开始，因为用户尚未单独确认“接受合约级改造与重部署”。

## Next Required Action
- 向用户展示本轮前端结果，并确认是否继续细修 `Goldmint` 金属风格细节。
- 若用户确认继续做“一次确认购买”，再进入合约方案审批与实现。

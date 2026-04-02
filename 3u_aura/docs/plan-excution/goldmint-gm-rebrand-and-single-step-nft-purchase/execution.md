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

## Incremental Update — 2026-03-30 18:51:10 +0800
- 按用户当前反馈，继续沿 `gm-preview` 预演页细化“更像参考图”的 3 个核心方向：
  - Hero 卡边框更厚、更柔，强化压边金属板感
  - Stat 卡边框更窄、更硬，强化小金属块感
  - 通用徽章从单层描边图标推进到更明显的 3D 徽章分层
- 已在 `apps/dapp/src/app/gm-preview/page.tsx` 内把 `MetalFrame` 改为可配置的多层结构：
  - 增加顶部高光层
  - 增加底部暗边层
  - 增加内收 bevel 层
  - 分别为 hero / stat / 透明卡配置不同厚度与硬度
- 已把 `CoinBadge` 细化为更明显的立体结构：
  - 深色底座
  - 外层金圈
  - 内盘
  - 图标阴影层
  - 图标高光层
  - 主图层
- 已尝试按仓库约定拉起本地 `testnet-mockusdt` 服务：
  - `dapp` 成功启动并监听 `3100`
  - `server` 首次启动因 `apps/server/dist` 清理失败报 `ENOTEMPTY`
  - 清理可重建产物后重启，`nest start --watch` 进程已启动，但截至本次记录 `3110` 健康口仍未就绪

### Commands Run (Incremental)
- `lsof -i :3100`
- `lsof -i :3110`
- `sed -n '1,220p' docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/plan.md`
- `sed -n '1,220p' docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/execution.md`
- `sed -n '1,420p' apps/dapp/src/app/gm-preview/page.tsx`
- `sed -n '421,520p' apps/dapp/src/app/gm-preview/page.tsx`
- `command -v pnpm`
- `corepack pnpm --version`
- `ls /opt/homebrew/bin/pnpm`
- `ls /usr/local/bin/pnpm`
- `/bin/zsh -lc 'export PATH=/usr/local/bin:$PATH; /usr/local/bin/pnpm run local:testnet:server'`
- `/bin/zsh -lc 'export PATH=/usr/local/bin:$PATH; /usr/local/bin/pnpm run local:testnet:dapp'`
- `rm -rf apps/server/dist`
- `curl -s http://127.0.0.1:3110/api/v1/health`
- `nl -ba apps/dapp/src/app/gm-preview/page.tsx | sed -n '1,420p'`
- `git diff -- apps/dapp/src/app/gm-preview/page.tsx`
- `ps -ef`
- `sleep 12`
- `date '+%Y-%m-%d %H:%M:%S %z'`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/node -v`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp typecheck`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`

### Verification Results (Incremental)
- `apps/dapp/src/app/gm-preview/page.tsx` 已按本轮目标完成局部细化，改动聚焦在预演页本身，没有扩散到正式页面。
- `3100` 端口已确认被本地 `next-server` 监听。
- `server` 侧 `nest start --watch` 进程已启动，但 `curl -s http://127.0.0.1:3110/api/v1/health` 仍返回 code `7`，说明本次记录时健康口尚未起来。
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/node -v` 返回 `v24.13.0`，已确认当前 shell 可直接使用该 Node 安装。
- `typecheck` 与 `eslint` 已重新发起，但在本次记录窗口内未返回完成结果，因此本次不宣称通过。

## Incremental Update — 2026-03-30 19:05:00 +0800
- 根据用户对边框拟真度的反馈，补做了一轮“素材缺口”研究，目标从“继续堆 CSS”切到“免费在线素材 + 本地组装”的实现路线。
- 已新增素材清单文件：
  - `docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase/free-materials-checklist.md`
- 结论：
  - 当前仓库已有品牌主徽章和 shield card 的矢量实现，可继续复用。
  - 当前最缺的是三套 UI 框资产、三类本地纹理、以及一套统一的实心 glyph。
  - 免费资源里最好找的是纹理，最难找的是“可直接商用且风格对版”的完整 UI 金属边框，因此建议用 `CC0` 纹理 + 免费 SVG 轮廓 + 我们本地拼装。
- 已记录可优先使用的免费来源：
  - `ambientCG`
  - `Poly Haven`
  - `Pixabay`
  - `Heroicons`
  - `SVG Repo`（逐素材确认 license）

### Commands Run (Incremental)
- `rg --files apps/dapp/public apps/dapp/src/components/branding apps/dapp/src/app | rg 'gm|gold|mint|badge|icon|logo|shield|frame|border|metal|nft|preview'`
- `sed -n '1,260p' apps/dapp/src/app/gm-preview/page.tsx`
- `sed -n '1,240p' /Users/ygg/.codex/skills/ui-ux-pro-max/SKILL.md`
- `ls apps/dapp/src/components/branding`
- `sed -n '1,260p' apps/dapp/src/components/branding/goldmint-emblem.tsx`
- `sed -n '1,260p' apps/dapp/src/components/branding/goldmint-shield-card.tsx`

### Verification Results (Incremental)
- 已确认 `gm-preview` 当前边框与徽章仍以 CSS 和 SVG 代码模拟为主，缺少本地 frame / texture / glyph 资产。
- 已确认仓库内已有可复用的 `GoldmintEmblem` 与 `GoldmintShieldCard`，因此本轮重点不在重做 logo，而在补齐 UI 边框与纹理素材。

## Incremental Update — 2026-03-30 19:37:13 +0800
- 已开始执行“免费在线素材改造”而不是继续堆纯 CSS：
  - 下载并落地本地纹理素材
  - 下载并落地本地实心 glyph
  - 新建本地 frame / badge SVG 资产
  - 将 `gm-preview` 重构为素材驱动版本
- 已新增本地纹理资源：
  - `apps/dapp/public/images/goldmint/textures/marble-light-01.jpg`
  - `apps/dapp/public/images/goldmint/textures/gold-surface-01.jpg`
  - `apps/dapp/public/images/goldmint/textures/copper-dark-01.jpg`
- 已新增本地 frame / badge 资源：
  - `apps/dapp/public/images/goldmint/frames/hero-frame.svg`
  - `apps/dapp/public/images/goldmint/frames/stat-frame.svg`
  - `apps/dapp/public/images/goldmint/frames/ivory-frame.svg`
  - `apps/dapp/public/images/goldmint/badges/badge-coin.svg`
- 已新增本地实心 glyph 资源：
  - `apps/dapp/public/images/goldmint/glyphs/calendar-days-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/user-group-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/trophy-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/bolt-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/sparkles-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/shield-check-solid.svg`
  - `apps/dapp/public/images/goldmint/glyphs/arrow-trending-up-solid.svg`
- `gm-preview` 已重构：
  - 页面背景改为本地大理石纹理
  - Hero / Stat / Ivory 卡改为本地 frame SVG 包裹
  - 卡面金属感改为本地纹理 + 少量渐变叠加
  - 徽章改为本地 coin SVG + 本地实心 glyph 做压印
  - 底部导航图标也已切换为实心 glyph 风格
- 一次失败已记录：
  - 试图下载 `SVG Repo` 的圆角框直链时命中了 `Vercel Security Checkpoint`
  - 因此最终未采用该下载内容，改为本地手写 frame SVG 资产

### Commands Run (Incremental)
- `curl -L -o /tmp/Marble019_1K-JPG.zip 'https://ambientcg.com/get?file=Marble019_1K-JPG.zip'`
- `curl -L -o /tmp/Metal048C_1K-JPG.zip 'https://ambientcg.com/get?file=Metal048C_1K-JPG.zip'`
- `curl -L -o /tmp/Metal057C_1K-JPG.zip 'https://ambientcg.com/get?file=Metal057C_1K-JPG.zip'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/calendar-days-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/calendar-days.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/user-group-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/user-group.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/trophy-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/trophy.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/bolt-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/bolt.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/sparkles-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/sparkles.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/shield-check-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/shield-check.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/glyphs/arrow-trending-up-solid.svg 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/arrow-trending-up.svg'`
- `curl -L -o apps/dapp/public/images/goldmint/source/rounded-frame-cc0.svg 'https://www.svgrepo.com/download/161038/rectangular-frame-with-rounded-corners.svg'`
- `unzip -l /tmp/Marble019_1K-JPG.zip`
- `unzip -l /tmp/Metal048C_1K-JPG.zip`
- `unzip -l /tmp/Metal057C_1K-JPG.zip`
- `unzip -j -o /tmp/Marble019_1K-JPG.zip 'Marble019_1K-JPG_Color.jpg' -d apps/dapp/public/images/goldmint/textures`
- `unzip -j -o /tmp/Metal048C_1K-JPG.zip 'Metal048C_1K-JPG_Color.jpg' -d apps/dapp/public/images/goldmint/textures`
- `unzip -j -o /tmp/Metal057C_1K-JPG.zip 'Metal057C_1K-JPG_Color.jpg' -d apps/dapp/public/images/goldmint/textures`
- `mv apps/dapp/public/images/goldmint/textures/Marble019_1K-JPG_Color.jpg apps/dapp/public/images/goldmint/textures/marble-light-01.jpg`
- `mv apps/dapp/public/images/goldmint/textures/Metal048C_1K-JPG_Color.jpg apps/dapp/public/images/goldmint/textures/gold-surface-01.jpg`
- `mv apps/dapp/public/images/goldmint/textures/Metal057C_1K-JPG_Color.jpg apps/dapp/public/images/goldmint/textures/copper-dark-01.jpg`
- `ls apps/dapp/public/images/goldmint/frames apps/dapp/public/images/goldmint/badges apps/dapp/public/images/goldmint/glyphs apps/dapp/public/images/goldmint/textures`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp typecheck`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `git status --short apps/dapp/src/app/gm-preview/page.tsx apps/dapp/public/images/goldmint docs/plan-excution/goldmint-gm-rebrand-and-single-step-nft-purchase`

### Verification Results (Incremental)
- `pnpm --dir apps/dapp typecheck` 通过。
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- 本地 DApp 日志确认 `HEAD /gm-preview 200` 与 `GET /gm-preview 200`，说明 `gm-preview` 页面在素材切换后仍可正常编译并返回。
- `apps/dapp/public/images/goldmint/` 已包含本轮使用的本地纹理、frame、badge、glyph 资产。

## Incremental Update — 2026-03-30 19:45:00 +0800
- 根据用户反馈，已撤回这轮“旧金属脏纹理直铺”的方向。
- 新调整只聚焦卡面光泽：
  - `hero` 卡面恢复为干净的纵向拉丝金属高光
  - `stat` 卡面恢复为放射状金属反光
  - 顶部 / pill 也从纹理直铺改回更干净的金属渐变
- 保留本轮已被用户认可的圆形徽章资产路线，不回退徽章

### Commands Run (Incremental)
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp typecheck`

### Verification Results (Incremental)
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- `pnpm --dir apps/dapp typecheck` 通过。
- 本地 DApp 日志再次确认 `GET /gm-preview 200`，说明本轮光泽回调后页面可正常编译与返回。

## Incremental Update — 2026-03-30 19:50:15 +0800
- 根据用户确认，继续只优化压印 3D 边框，不改已较接近目标的圆形徽章方向。
- 已把三套 frame 从“多道描边”重构为“filled band” 结构：
  - `hero-frame.svg`
  - `stat-frame.svg`
  - `ivory-frame.svg`
- 本轮边框优化重点：
  - 外层改为实心金属带，而不是单纯 stroke
  - 内侧补入暖白 lip / 内唇
  - 顶部补宽高光带
  - 底部补压暗压厚带
  - Hero 增加右下压重感
  - Stat 收窄并强化硬边块状感
  - Ivory 改成暖白内芯 + 金属外圈 + 轻内凹

### Commands Run (Incremental)
- `curl -I http://127.0.0.1:3100/gm-preview`
- `date '+%Y-%m-%d %H:%M:%S %z'`

### Verification Results (Incremental)
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。
- 本地 DApp 日志确认本轮 frame 资产替换后：
  - `GET /gm-preview 200`
  - `HEAD /gm-preview 200`

## Incremental Update — 2026-03-30 20:05:30 +0800
- 根据用户同意，开始直接从设计图原图提取边框素材，切换到 `9-slice PNG/WebP` 路线。
- 已确认原始设计图尺寸：
  - `768 x 1375`
- 本机无 `magick / convert / ffmpeg / pngquant`，也无 `PIL`，因此采用系统自带 `sips` 进行裁图。
- 已从设计图裁出三张 9-slice 源图：
  - `apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png`
- 已将 `gm-preview` 的 frame 管线从“SVG overlay”切换为 `border-image`：
  - Hero 使用 `hero-frame-source.png`
  - Stat 使用 `stat-frame-source.png`
  - White / ivory 卡使用 `ivory-frame-source.png`
- 当前实现是“设计图裁切源图 + HTML/CSS 内容层”的首版 9-slice 原型，后续仍可继续细调 crop 与 slice 数值。

### Commands Run (Incremental)
- `sips -g pixelWidth -g pixelHeight /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png`
- `sips -c 250 650 --cropOffset 118 58 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
- `sips -c 170 320 --cropOffset 376 52 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
- `sips -c 100 660 --cropOffset 630 54 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png`
- `sips -c 228 612 --cropOffset 124 76 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
- `sips -c 152 286 --cropOffset 402 68 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
- `sips -c 86 612 --cropOffset 690 72 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png`
- `sips -c 226 590 --cropOffset 124 87 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
- `sips -c 146 264 --cropOffset 404 78 /Users/ygg/Downloads/Gemini_Generated_Image_7rtdqq7rtdqq7rtd.png --out apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp typecheck`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Incremental)
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- `pnpm --dir apps/dapp typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。
- 本地 DApp 日志再次确认：
  - `GET /gm-preview 200`
  - `HEAD /gm-preview 200`

## Incremental Update — 2026-03-30 20:21:37 +0800
- 按用户同意，开始补齐本地图像工具链，用于正式处理 9-slice 边框资产。
- 已确认并可用的工具：
  - `/usr/local/bin/magick`
  - `/usr/local/bin/pngquant`
  - `/usr/local/bin/cwebp`
- 已使用 `magick` 基于裁好的设计图边框源图生成透明中心 9-slice 资产：
  - `apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png`
- 已导出更轻量的 WebP 版本：
  - `apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.webp`
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.webp`
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.webp`
- `gm-preview` 已切换到使用这 3 张 WebP 边框资产，而不是直接使用整张 PNG 裁图。
- 当前 `brew install imagemagick pngquant webp` 已经把本任务所需的三项工具装好，但 Homebrew 仍在继续处理自动触发的依赖升级链；本任务不依赖其剩余输出。

### Commands Run (Incremental)
- `/usr/local/bin/brew install imagemagick pngquant webp`
- `/usr/local/bin/magick --version`
- `/usr/local/bin/pngquant --version`
- `/usr/local/bin/cwebp -version`
- `/usr/local/bin/magick identify -format '%f %[channels]\\n' apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png`
- `/usr/local/bin/magick apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png \( -size 590x226 xc:white -fill black -draw "roundrectangle 20,20 570,206 22,22" \) -alpha off -compose copyopacity -composite apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png`
- `/usr/local/bin/magick apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png \( -size 264x146 xc:white -fill black -draw "roundrectangle 16,16 248,130 18,18" \) -alpha off -compose copyopacity -composite apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png`
- `/usr/local/bin/magick apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png \( -size 612x86 xc:white -fill black -draw "roundrectangle 14,14 598,72 16,16" \) -alpha off -compose copyopacity -composite apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png`
- `/usr/local/bin/cwebp -q 92 -alpha_q 100 apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.webp`
- `/usr/local/bin/cwebp -q 92 -alpha_q 100 apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.webp`
- `/usr/local/bin/cwebp -q 92 -alpha_q 100 apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.webp`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `env PATH=/usr/local/bin:/usr/bin:/bin /usr/local/bin/pnpm --dir apps/dapp typecheck`
- `curl -I http://127.0.0.1:3100/gm-preview`
- `date '+%Y-%m-%d %H:%M:%S %z'`

### Verification Results (Incremental)
- `magick identify` 显示 3 张 `*-9slice.png` 都是 `srgba`，已带 alpha 通道。
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- `pnpm --dir apps/dapp typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。
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

## Incremental Update — 2026-03-30 9-Slice Frame Cleanup Pass
- 重新整理了 `gm-preview` 的三套 9-slice 边框素材，不再沿用带错位内容的旧裁片：
  - `hero`：改为更完整的整卡源图，并重新生成贴边的薄 rim 版本
  - `stat`：修正了上一轮错误的裁点，恢复完整卡片轮廓后再生成 9-slice
  - `ivory`：由于左侧徽章天然贴边，单纯整卡裁片会污染左侧 rim，本轮改为基于右侧干净边框镜像生成专用 9-slice 源图
- 三套最终运行时资产现已更新到：
  - `apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png`
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png`
  - 并同步导出了对应 `webp`
- `apps/dapp/src/app/gm-preview/page.tsx` 已切回使用 `PNG` 边框资产，并把 `borderWidth / borderImageSlice` 调整为更贴近参考图的薄 rim 参数：
  - `hero`: `borderWidth=14`, `slice=6`
  - `stat`: `borderWidth=10`, `slice=6`
  - `ivory`: `borderWidth=8`, `slice=4`
- 本轮明确确认了一个设计实现原则：
  - 运行时仍按 `4 边 + 4 角` 的结构理解边框
  - 但不再强行转成纯 SVG 矢量描边
  - 最终仍以贴边的 `9-slice PNG/WebP` 作为主资产格式

### Commands Run (9-Slice Cleanup Pass)
- `cp /tmp/hero-source-manual-02.png apps/dapp/public/images/goldmint/frames-9slice/hero-frame-source.png`
- `cp /tmp/stat-source-manual-02.png apps/dapp/public/images/goldmint/frames-9slice/stat-frame-source.png`
- `cp /tmp/ivory-source-clean-wide.png apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-source.png`
- `cp /tmp/hero-frame-edge.png apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png`
- `cp /tmp/stat-frame-edge.png apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png`
- `cp /tmp/ivory-frame-edge.png apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png`
- `cwebp -quiet -q 92 apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/hero-frame-9slice.webp`
- `cwebp -quiet -q 92 apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/stat-frame-9slice.webp`
- `cwebp -quiet -q 92 apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.png -o apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-9slice.webp`
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx`
- `pnpm --dir apps/dapp typecheck`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (9-Slice Cleanup Pass)
- `pnpm --dir apps/dapp exec eslint src/app/gm-preview/page.tsx` 通过。
- `pnpm --dir apps/dapp typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。
- 本轮尝试使用本地 `agent-browser` 直接抓取页面截图，但当前 shell 环境里 `agent-browser` 不在 `PATH`，因此未完成自动浏览器截图验证。

## Incremental Update — 2026-03-31 Night Theme Light Card Contrast Hotfix
- 针对夜间主题下“浅金卡片文字几乎看不清”的问题，新增了局部补丁类 `goldmint-light-card`。
- 该类只在 `.night` 主题中生效，用来为浅金卡容器局部重置以下变量：
  - `--shell-title`
  - `--shell-copy`
  - `--shell-text-soft`
  - `--shell-text-muted`
  - `--shell-border`
  - `--shell-inset`
  - `--shell-soft-surface`
  - `--shell-surface-strong`
  - `--shell-badge-fg`
- 这样不会影响深色底板、底部导航、深铜按钮，只提升浅色卡面的文字和说明对比度。
- 本轮已将该补丁挂到用户截图里对应的浅色卡容器：
  - `dashboard-page.tsx` 中的顶部统计卡、里程碑浅卡、功能入口卡
  - `bottom-nav.tsx` 中的主题卡、语言卡、快捷操作卡、偏好设置卡
  - `nft-page.tsx` 中的购买提示浅金说明板、价格/余额/剩余数量卡、材质/工艺/权益小卡、推荐里程碑卡

### Commands Run (Night Theme Hotfix)
- `pnpm --dir apps/dapp exec eslint src/components/pages/dashboard-page.tsx src/components/ui-custom/bottom-nav.tsx src/components/pages/nft-page.tsx src/app/globals.css`
- `pnpm --dir apps/dapp typecheck`
- `curl -I http://127.0.0.1:3100`

### Verification Results (Night Theme Hotfix)
- `pnpm --dir apps/dapp exec eslint ...` 通过；`globals.css` 在当前配置中被忽略，返回 1 条 warning，无错误。
- `pnpm --dir apps/dapp typecheck` 通过。
- `curl -I http://127.0.0.1:3100` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-01 Stat Hairline Debossed Experiment
- 为了验证“极细金属压印边框”是否比当前 `stat` 的 9-slice 边框更接近目标，`gm-preview` 中的两个 `StatTile` 暂时从 `FrameShell + border-image` 切换到了纯 CSS 的 `HairlineFrameShell`。
- 本轮只改 `stat` 小卡，`hero` 大卡和 `ivory` 白底卡保持原样，便于直接肉眼比较边框语言差异。
- 新的 `HairlineFrameShell` 采用：
  - 外层 2px 极细金属线宽
  - 一层暖金高光 + 一层深茶压印阴影
  - 内层再补 1px 顶/底细线，模拟贴边的 debossed 轮廓
- `stat` 卡面本身的拉丝/放射金属光泽与圆形徽章未改，只替换外框实现方式。

### Commands Run (Stat Hairline Debossed Experiment)
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/app/gm-preview/page.tsx`
- `/usr/local/bin/node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Stat Hairline Debossed Experiment)
- `eslint` 通过。
- `typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-01 Stat Asset-Driven Hairline Rim Retry
- 用户提供了新的 `screen1.png` 作为极细金属边框参考图，目标是让 `stat` 小卡回到素材驱动，而不是纯 CSS 压印模拟。
- 该素材文件本身仍为 `RGB` 且无 alpha，因此先用 ImageMagick 将深灰棋盘背景抠除并裁边，生成了可直接用于 `border-image` 的透明边框资产：
  - `apps/dapp/public/images/goldmint/frames-9slice/stat-frame-hairline-9slice.png`
- `gm-preview` 中的 `stat` 小卡已从 `HairlineFrameShell` 切回 `FrameShell`，并接入上述新资产：
  - `framePaths.stat = "/images/goldmint/frames-9slice/stat-frame-hairline-9slice.png"`
  - 当前试值：`borderWidth={7}`, `slice={112}`
  - 内层圆角同步调大到 `rounded-[1.55rem]`，以贴近新素材的圆角语言
- 同时移除了本轮纯 CSS 实验用的 `HairlineFrameShell`，避免影响后续判断。

### Commands Run (Stat Asset-Driven Hairline Rim Retry)
- `/usr/local/bin/magick apps/dapp/public/images/goldmint/frames-9slice/screen1.png -alpha set -fuzz 20% -transparent '#1E1E1E' -trim +repage apps/dapp/public/images/goldmint/frames-9slice/stat-frame-hairline-9slice.png`
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/app/gm-preview/page.tsx`
- `/usr/local/bin/node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Stat Asset-Driven Hairline Rim Retry)
- `stat-frame-hairline-9slice.png` 已生成，尺寸为 `898 x 887`，`RGBA`，带 alpha。
- `eslint` 通过。
- `typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-01 Borderless Baseline Pass
- 根据最新反馈，`gm-preview` 当前版本的主要判断任务从“继续调边框”切换为“先去掉所有显式边框，观察纯材质关系”。
- 因此本轮统一移除了页面中的显式边框语言：
  - 所有 `FrameShell` 的 `border-image` 接法暂停使用
  - 顶部导航栏的底部分隔线移除
  - 顶部两个胶囊筛选器的边框移除
  - 底部说明 pill 的描边移除
- `FrameShell` 被临时降级为无边框容器，只保留卡面、圆角、内层光泽与徽章，用来建立新的“无边框基线版”。
- 本轮未改文案、排版层级、金属徽章，也未改 hero/stat/ivory 的卡面纹理。

### Commands Run (Borderless Baseline Pass)
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/app/gm-preview/page.tsx`
- `/usr/local/bin/node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Borderless Baseline Pass)
- `eslint` 通过。
- `typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-01 Ivory Hairline Frame Attempt Using 24.png
- 用户指定尝试将 `24.png` 这类更克制的细金属边框语言应用到 `ivory` 组卡片。
- 先将 `24.png` 的白底背景抠成透明，并裁边生成新资产：
  - `apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-hairline-24.png`
- 新资产尺寸为 `797 x 799`，`RGBA`，带 alpha，可直接用于 `border-image`。
- `FrameShell` 重新改为支持“可选边框”模式：
  - 未提供 `frameSrc / borderWidth / slice` 时继续作为无边框容器
  - 提供参数时再启用 `border-image`
- 本轮只把 `ivory` 组卡片重新接回细边框：
  - 功能入口四张卡
  - “里程碑与提醒”卡
- 当前试值：
  - `frameSrc = "/images/goldmint/frames-9slice/ivory-frame-hairline-24.png"`
  - `borderWidth = 5`
  - `slice = 88`
  - 内层圆角从 `1.18rem` 调整为 `1.45rem`
- `hero` 与 `stat` 继续保持无边框基线，便于独立判断 `ivory` 细边效果。

### Commands Run (Ivory Hairline Frame Attempt)
- `/usr/local/bin/magick apps/dapp/public/images/goldmint/frames-9slice/24.png -alpha set -channel RGBA -fuzz 8% -fill none -draw "color 1,1 floodfill" -draw "color 1022,1 floodfill" -draw "color 1,1022 floodfill" -draw "color 1022,1022 floodfill" -draw "color 512,512 floodfill" -trim +repage apps/dapp/public/images/goldmint/frames-9slice/ivory-frame-hairline-24.png`
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/app/gm-preview/page.tsx`
- `/usr/local/bin/node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Ivory Hairline Frame Attempt)
- `ivory-frame-hairline-24.png` 已生成，尺寸为 `797 x 799`，`RGBA`，带 alpha。
- `eslint` 通过。
- `typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-01 Ivory Hairline Reverted
- 实际页面验证后，`24.png` 抠底生成的 `ivory` 细边资产出现两个不可接受的问题：
  - 白底抠出的边缘存在残留与毛刺
  - 素材的角半径与横向 `ivory` 卡片不匹配，导致轮廓“套不上”
- 因此本轮不继续微调 `slice / borderWidth`，而是直接撤回 `ivory` 边框尝试。
- `gm-preview` 重新回到“无边框基线版”：
  - 功能入口四张卡恢复无边框
  - “里程碑与提醒”卡恢复无边框
  - `FrameShell` 再次简化为纯容器，不再带可选 `border-image` 参数
- 结论：
  - 当前由白底图抠出的 `ivory` 细边资产不适合继续使用
  - 后续如果要重启 `ivory` 边框，需要直接从设计工具导出真正透明、且与卡片长宽比/圆角一致的专用素材

### Commands Run (Ivory Hairline Reverted)
- `/usr/local/bin/node node_modules/eslint/bin/eslint.js src/app/gm-preview/page.tsx`
- `/usr/local/bin/node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
- `curl -I http://127.0.0.1:3100/gm-preview`

### Verification Results (Ivory Hairline Reverted)
- `eslint` 通过。
- `typecheck` 通过。
- `curl -I http://127.0.0.1:3100/gm-preview` 返回 `HTTP/1.1 200 OK`。

## Incremental Update — 2026-04-02 Wallet Icon And Metadata Refresh
- 用户提供新的 `GM` 金币图作为钱包入口图标参考。
- 已将该图片裁成圆形币面资源，并落到 DApp 根级图标入口：
  - `apps/dapp/src/app/icon.png`
  - `apps/dapp/src/app/apple-icon.png`
  - `apps/dapp/src/app/favicon.ico`
  - `apps/dapp/public/gm-icon-192.png`
  - `apps/dapp/public/gm-icon-512.png`
- 已删除旧的 `apps/dapp/src/app/icon.svg`，避免 Next.js 文件路由继续暴露旧图标。
- 已补齐根级 metadata 与 web manifest，统一改为 `Goldmint GM`，不再暴露旧的 AURA 提示语。

### Commands Run (Wallet Icon And Metadata Refresh)
- `swift -module-cache-path /tmp/swift-module-cache - <<'SWIFT' ... SWIFT`
- `/usr/local/bin/magick apps/dapp/src/app/icon.png -define icon:auto-resize=64,48,32,16 apps/dapp/src/app/favicon.ico`
- `sips -s format png apps/dapp/src/app/favicon.ico --out /tmp/gm-favicon-preview.png`

### Verification Results (Wallet Icon And Metadata Refresh)
- 新 `icon.png` 已使用用户提供的 GM 金币图，且已放大消除原图棋盘格边缘。
- 新 `favicon.ico` 已包含 `64/48/32/16` 多尺寸输出，预览可正常显示 GM 金币图标。
- 根级 metadata / manifest 已切换到 `Goldmint GM` 文案，不再使用旧的 `AURA` 提示语。

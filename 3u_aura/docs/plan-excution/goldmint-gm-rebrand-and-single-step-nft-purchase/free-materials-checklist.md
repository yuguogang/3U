# Free Materials Checklist For GM Preview

## Goal
把 `gm-preview` 从“CSS 模拟金属 UI”推进到“免费在线素材 + 本地组装”的可落地方案，优先解决边框不够像参考图的问题。

## What We Already Have In Repo
- 品牌主徽章：
  - `apps/dapp/src/components/branding/goldmint-emblem.tsx`
- NFT / Shield 主视觉：
  - `apps/dapp/src/components/branding/goldmint-shield-card.tsx`
- `gm-preview` 页面结构与卡位：
  - `apps/dapp/src/app/gm-preview/page.tsx`

## What Is Still Missing

### Must-Have
1. `hero` 厚压边金属框资产
   - 用途：顶部大金卡
   - 目标感觉：厚、柔、压边金属板
   - 形式建议：`SVG` 或 `9-slice PNG/WebP`

2. `stat` 硬金属框资产
   - 用途：两张中号统计卡
   - 目标感觉：更窄、更硬、更像小金属块
   - 形式建议：`SVG` 或 `9-slice PNG/WebP`

3. `ivory` 暖白内芯金属框资产
   - 用途：里程碑提醒卡、功能入口卡
   - 目标感觉：暖白内芯 + 金属外圈 + 轻内凹
   - 形式建议：`SVG` 或 `9-slice PNG/WebP`

4. 本地金属表面纹理
   - 用途：hero / stat 卡表面，不再依赖纯 CSS 渐变
   - 至少需要：
     - `brushed-gold`
     - `radial-gold-burst`
     - `warm-ivory-surface`

5. 本地大理石背景纹理
   - 用途：页面底纹
   - 当前 `gm-preview` 还是远程 Unsplash URL，后续应切到本地素材

6. 实心 glyph 图标集
   - 用途：每日签到、团队、奖励、NFT、闪电、趋势
   - 当前问题：Lucide 线框图标过轻，压不住金属徽章
   - 目标感觉：实心、可做浮雕、可压印

### Nice-To-Have
1. 圆形加号主按钮金属圈资产
2. 顶部品牌 coin 的高精版本
3. 顶部/底部导航条的细金属噪点纹理

## Best Free Source Strategy

### A. Textures: Prefer CC0 PBR Sources
这些站点最适合拿“背景 / 金属表面 / 石材底纹”，因为许可最干净。

- ambientCG License:
  - https://docs.ambientcg.com/license/
  - 站点资产为 `CC0`
- ambientCG Marble 019:
  - https://ambientcg.com/view?id=Marble019
  - 适合浅米白大理石底
- ambientCG Marble 025:
  - https://ambientcg.com/view?id=Marble025
  - 适合更粗糙、更暖的白石底
- ambientCG Metal 048 C:
  - https://ambientcg.com/view?id=Metal048C
  - `Gold Impure Metal Rough`
  - 适合金属边与旧金表面采样
- ambientCG Metal 057 C:
  - https://ambientcg.com/view?id=Metal057C
  - `Copper Metal Smooth Smudge`
  - 适合深铜、暗边、导航金属感
- ambientCG Metal 044 A:
  - https://ambientcg.com/a/Metal044A
  - 适合做高光金属片段

- Poly Haven License:
  - https://polyhaven.com/license
  - 全站资产为 `CC0`

### B. Photos / Flat Textures: Secondary Source
如果想找更快可用的背景图，而不是完整 PBR 贴图，可以从这些站点选图。

- Pixabay License Summary:
  - https://pixabay.com/service/license-summary/
  - 可免费使用和改造，但不能把素材原样独立转售
- 白色大理石检索页：
  - https://pixabay.com/images/search/white%20marble%20texture/
- 金色纹理检索页：
  - https://pixabay.com/images/search/gold%20texture/

### C. Vector Frames / Shape Primitives
免费高质量“整套 UI 金属边框”很少，建议拿基础矢量轮廓，再结合纹理做本地资产。

- SVG Repo Rounded Rectangle Frame:
  - https://www.svgrepo.com/svg/161038/rectangular-frame-with-rounded-corners
  - 页面标注该项为 `CC0`
- SVG Repo Shield:
  - https://www.svgrepo.com/svg/150828/shield
  - 页面标注该项为 `CC0`
- SVG Repo Medal:
  - https://www.svgrepo.com/svg/39544/medal
  - 页面标注该项为 `CC0`

说明：
- `SVG Repo` 是可用来源，但它是“逐条素材看 license”的站点，不建议整站一概而论。
- 真正下载前，保留素材页面截图或链接，避免后面追溯困难。

### D. Solid Glyph Icons
优先用同一套实心图标，避免混用多个风格。

- Heroicons official:
  - https://heroicons.com/
  - 官方页面说明为 `MIT license`
- Heroicons GitHub:
  - https://github.com/tailwindlabs/heroicons
  - 仓库说明为 `MIT license`

推荐替换方向：
- 日历：`calendar-days`
- 团队：`user-group`
- 奖励：`trophy`
- 趋势：`arrow-trending-up`
- 提醒：`bolt` 或 `shield-check`

## Recommended Asset Pack To Collect First

### Phase 1: Enough To Fix The Borders
1. `bg-marble-light`
2. `tex-gold-brushed`
3. `tex-gold-radial`
4. `tex-copper-dark`
5. `frame-hero-gold`
6. `frame-stat-gold`
7. `frame-ivory-gold`

### Phase 2: Enough To Fix The Badges
1. `badge-coin-base`
2. `badge-ring-gold`
3. `badge-inner-disc`
4. `glyph-calendar-solid`
5. `glyph-team-solid`
6. `glyph-trophy-solid`
7. `glyph-nft-solid`
8. `glyph-alert-solid`

## Suggested Local Folder Layout
- `apps/dapp/public/images/goldmint/textures/`
- `apps/dapp/public/images/goldmint/frames/`
- `apps/dapp/public/images/goldmint/badges/`
- `apps/dapp/public/images/goldmint/glyphs/`

## Suggested File Names
- `textures/marble-light-01.webp`
- `textures/gold-brushed-01.webp`
- `textures/gold-radial-01.webp`
- `textures/copper-dark-01.webp`
- `frames/frame-hero-gold.svg`
- `frames/frame-stat-gold.svg`
- `frames/frame-ivory-gold.svg`
- `badges/badge-coin-base.svg`
- `badges/badge-ring-gold.svg`
- `badges/badge-inner-disc.svg`
- `glyphs/calendar-solid.svg`
- `glyphs/team-solid.svg`
- `glyphs/trophy-solid.svg`
- `glyphs/nft-solid.svg`
- `glyphs/alert-solid.svg`

## Practical Build Recommendation
不要优先找“整张完整卡片素材”，而要优先找以下组合：
- `纹理素材`
- `边框轮廓`
- `实心 glyph`

然后在项目里拼成：
- 本地 frame 资产
- 本地 badge 资产
- 保留 HTML 文案与数据层

这样响应式、可维护性、可替换性都最好。

## Decision
当前最缺的不是 logo，也不是背景，而是这三组：
1. `hero / stat / ivory` 三套框资产
2. `gold / ivory / marble` 三类本地纹理
3. 一套统一的实心 glyph 图标

只要这三组补齐，`gm-preview` 就可以从“代码 3D”切到“素材驱动的金属 UI”。

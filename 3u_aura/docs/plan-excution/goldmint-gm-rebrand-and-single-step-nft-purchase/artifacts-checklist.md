# Goldmint Dashboard Artifacts Checklist

## Objective
- 为 `Goldmint / $GM` 首页与 NFT 视觉重构准备可落地的素材清单。
- 目标不是继续“纯 CSS 模拟”，而是改为“素材 + 组件组装”。

## Recommended Workflow
1. 先确定每类素材的视觉方向与来源。
2. 优先使用 `CC0` 或明确可商用素材站。
3. 先拿低风险通用材质图，再决定是否补 AI / 3D 渲染资产。
4. 素材确认后统一落到项目目录，再开始正式页面重构。

## Asset List

### A1. Marble Background
- **用途**：页面大背景、状态卡底板的浅纹理层。
- **目标质感**：暖白底、淡金线、不要灰、不偏冷。
- **优先来源**：
  - `ambientCG`:
    - `https://ambientcg.com/view?id=Marble007`
    - `https://ambientcg.com/view?id=Marble005`
    - `https://ambientcg.com/view?id=Marble003`
  - `cgbookcase`:
    - `https://www.cgbookcase.com/`
- **搜索词**：
  - `white marble`
  - `beige light marble`
  - `clean marble white`
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/marble-bg-01.jpg`
  - `apps/dapp/public/goldmint/marble-bg-02.jpg`
- **筛选标准**：
  - 金线细、分布稀疏
  - 不要太强的云雾纹
  - 缩到手机宽度后仍自然

### A2. Matte Brushed Gold Hero Plate
- **用途**：顶部大卡 `累计获得 AURA / $GM` 的主底板。
- **目标质感**：拉丝哑光、略厚、有边缘金属包边。
- **优先来源**：
  - `ambientCG` 金属材质页：
    - `https://ambientcg.com/`
  - `TextureCan` 金属贴图：
    - `https://www.texturecan.com/`
- **搜索词**：
  - `brushed gold`
  - `gold metal`
  - `matte gold plate`
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/hero-brushed-gold-01.jpg`
- **筛选标准**：
  - 纹理方向尽量横向或可旋转后适配
  - 不要过强镜面反射
  - 中央区域适合叠加文字

### A3. Radial Gold Stat Card Base
- **用途**：`当前周期`、`小区业绩` 两张小统计卡。
- **目标质感**：中心放射拉丝、局部高光、像金属唱片面。
- **优先来源**：
  - `TextureCan`：
    - `https://www.texturecan.com/details/423/`
  - `Poly Haven`：
    - `https://polyhaven.com/`
- **搜索词**：
  - `radially brushed gold`
  - `anisotropic gold`
  - `radial brushed metal`
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/stat-radial-gold-01.jpg`
  - `apps/dapp/public/goldmint/stat-radial-gold-02.jpg`
- **筛选标准**：
  - 中心亮斑明确
  - 可裁成圆角矩形后不失真
  - 亮度不能压住黑色文字

### A4. Metal Badge Icons
- **用途**：顶部 logo、功能入口图标、状态卡圆徽章。
- **目标质感**：压铸金币 / 金属徽章，不再用 `Lucide` 线框图当最终稿。
- **优先来源**：
  - 先用 AI / 3D 生成参考，再做最终资产
  - `Blender` 官方：
    - `https://www.blender.org/`
  - `TextureCan` 3D 资源入口：
    - `https://www.texturecan.com/models/`
- **需要的图标集合**：
  - `calendar`
  - `team / users`
  - `trophy`
  - `diamond / nft`
  - `lightning / status`
  - `plus`
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/icons/icon-badge-calendar.webp`
  - `apps/dapp/public/goldmint/icons/icon-badge-team.webp`
  - `apps/dapp/public/goldmint/icons/icon-badge-trophy.webp`
  - `apps/dapp/public/goldmint/icons/icon-badge-diamond.webp`
  - `apps/dapp/public/goldmint/icons/icon-badge-status.webp`
  - `apps/dapp/public/goldmint/icons/icon-badge-plus.webp`
- **筛选标准**：
  - 图标风格统一
  - 外圈厚度一致
  - 高光方向一致

### A5. 3D Glowing Numbers
- **用途**：hero 区数字 `0 / 03` 一类核心视觉。
- **目标质感**：有厚度、发光、略像抛光金属体。
- **优先来源**：
  - `Blender`：
    - `https://www.blender.org/about/`
  - 可先用 AI 生成参考，再转正式资产
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/numbers/num-0-gold.webp`
  - `apps/dapp/public/goldmint/numbers/num-03-gold.webp`
- **筛选标准**：
  - 透明背景
  - 数字边缘清晰
  - 缩到移动端仍有体积感

### A6. Transparent Gold Border Card Frame
- **用途**：`NFT 达标状态`、提醒卡、轻量信息卡。
- **目标质感**：暖白半透底 + 金属边框，不偏玻璃蓝。
- **优先来源**：
  - 这一类可以代码为主，只需少量辅助纹理
  - 可复用 `A1` 大理石与 `A2` 金属边缘贴图
- **建议落地文件名**：
  - `apps/dapp/public/goldmint/frame-soft-gold-border.png`
- **筛选标准**：
  - 边框柔和
  - 不喧宾夺主
  - 适合列表复用

## Free / Commercial-Safe Sources
- `ambientCG` 许可页：`https://docs.ambientcg.com/license/`
  - 官方说明：`CC0 1.0`
- `Poly Haven` 许可页：`https://polyhaven.com/license`
  - 官方说明：`CC0`
- `TextureCan` 条款页：`https://www.texturecan.com/terms/`
  - 官方说明：`CC0 1.0`
- `cgbookcase` 首页：`https://www.cgbookcase.com/`
  - 官方说明：`100% free, no restrictions`

## Optional AI / 3D Tools
- `Blender`：`https://www.blender.org/`
  - 适合做最终 3D 数字、徽章、透明 PNG 导出
- `Ideogram` 定价页：`https://docs.ideogram.ai/plans-and-pricing/plans-and-pricing`
  - 适合先出风格参考图
- `Leonardo` 定价页：`https://leonardo.ai/pricing/`
  - 适合快速出概念稿，但终稿仍建议人工筛选

## What Codex Can Do vs What User Should Do

### Codex Can Do
- 帮你搜官方素材站并做 shortlist。
- 帮你定义每类素材的视觉筛选标准。
- 拿到明确素材 URL 后，帮你整理文件命名和落地路径。
- 在素材到位后，把页面改成“资产驱动”的高还原版本。

### Codex Usually Should Not Do Automatically
- 不应对第三方素材站做大规模无差别抓取。
- 不应在未确认许可与来源前，自动把不明资产塞进项目。
- 对需要登录、人工挑选、风格判断很强的素材，最好先由你确认。

### Best Collaboration Mode
- **方案 A（推荐）**：我负责搜索和给候选链接，你点头选图。
- **方案 B**：你自己下载素材后发我，或放到 Google Drive / 本地目录，我负责整理和接入。
- **方案 C**：如果你给出少量明确 URL，我再按这些 URL 去落地到项目。

## Suggested Next Acquisition Batch
- 第一批先只拿 4 个素材：
  - `1` 张大理石背景
  - `1` 张 hero 拉丝金属贴图
  - `1` 张 radial gold 统计卡底图
  - `1` 组金属 badge 图标参考
- 这 4 个到位后，就足够重做首页第一版。

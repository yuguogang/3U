# Goldmint Artifacts Shortlist — Batch 01

## Purpose
- 先锁定首页重构第一批最关键的 4 类素材。
- 这批素材足够支持首页做出比当前版本更接近参考图的第一版。

## Source Policy
- 优先使用官方站点与明确许可页面。
- 优先选择 `CC0` 或官方明确“free / no restrictions”的来源。
- 本文只做 shortlist，不代表已经下载进项目。

## Batch 01 Summary

| Category | Recommended Pick | Backup Picks | Why |
|---|---|---|---|
| Marble background | `Unsplash Augustine Wong white marble photo` | `ambientCG Marble005`, `ambientCG Marble019` | 更接近参考图的整页暖白大理石观感 |
| Hero brushed gold plate | `cgbookcase Brushed Gold 01` | `cgbookcase Brushed Gold 02`, `ambientCG Metal048C` | 哑光拉丝更稳，适合叠文案 |
| Radial stat card base | `TextureCan Radially Brushed Gold Texture (use plane map only)` | `ambientCG Metal051A`, `ambientCG Metal051B` | 唯一直接命中“中心放射拉丝”，且页面内含 plane 预览 |
| Metal badge reference | `TextureCan Gold Coin 3D Model` | `TextureCan Gold Bar 3D Model`, `TextureCan Gold Coin Texture` | 可直接做 badge / coin 参考母体 |

## User Selection Status

### Confirmed
- `Marble`: `A` → `Unsplash Augustine Wong white marble photo`
- `Hero`: `A` → `cgbookcase Brushed Gold 01`

### Pending
- `Stat`: 待定，继续补更平面的放射拉丝候选

### Clarified
- 你刚提到的“多圆盘金属球”**不建议直接作为 `Stat` 卡片底图**。
- 这类素材更适合转为：
  - `Badge` / `coin` 参考
  - 中间 `plus` 按钮金属盘面
  - 小型圆形装饰件
- 因此当前建议是：
  - `Badge`: 可以吸收这张素材的质感语言
  - 但最终 `Badge` 不等于“整颗球直接上页面”
  - `Stat A`: 若采用 `TextureCan 423`，只取它的 `Plane` 平面贴图，不使用球体渲染图

## 1) Marble Background

### Pick A — Best Starting Point
- `Unsplash Augustine Wong white marble photo`
- Link: `https://unsplash.com/photos/a-close-up-of-a-white-marble-surface-li0iC0rjvvg`
- Why:
  - 视觉上更接近参考图的暖白网页背景
  - 官方页面提供 `Download free`
  - 页面写明适用 `Unsplash License`
- Use rule:
  - 更适合做整页背景 `cover / crop`
  - **不建议当成“无缝平铺贴图”理解**

### Pick B — Lighter Variant
- `ambientCG Marble005`
- Link: `https://ambientcg.com/view?id=Marble005`
- Why:
  - 更偏材质贴图范式
  - 如果后面需要更可控的纹理重复与局部裁切，这张更稳

### Pick C — Backup from Second Source
- `ambientCG Marble019`
- Link: `https://ambientcg.com/view?id=Marble019`
- Why:
  - 更亮
  - 适合作为更轻纹理备选

### My Recommendation
- 首页背景先选 `Unsplash` 这张
- 如果后面需要更工程化、可控的贴图，再回退到 `ambientCG Marble005`

## 2) Hero Brushed Gold Plate

### Pick A — Best Starting Point
- `cgbookcase Brushed Gold 01`
- Link: `https://www.cgbookcase.com/textures/brushed-gold-01`
- Why:
  - 直接就是 `Brushed Gold`
  - 适合做大卡哑光拉丝底板
  - 文字可读性通常比镜面金属更好

### Pick B — Slight Variant
- `cgbookcase Brushed Gold 02`
- Link: `https://www.cgbookcase.com/textures/brushed-gold-02`
- Why:
  - 可作为色温和纹理强度备选

### Pick C — Rougher Gold
- `ambientCG Metal048C`
- Link: `https://ambientcg.com/view?id=Metal048C`
- Why:
  - 标签含 `Gold Impure Metal Rough`
  - 更有“真实金属”感，但可能稍脏

### My Recommendation
- 先选 `cgbookcase Brushed Gold 01`
- 这一张最适合首页 hero，不容易翻车

## 3) Radial Gold Stat Card Base

### Pick A — Best Starting Point
- `TextureCan Radially Brushed Gold Texture`
- Link: `https://www.texturecan.com/details/423/`
- Why:
  - 官方描述直接写了 `Radially Brushed Gold`
  - 有明显的 `anisotropic` 放射拉丝
  - 页面同时给了 `Sphere / Cylinder / Plane` 三种预览
  - 这是最贴参考图“小区业绩卡”质感的候选
- Use rule:
  - **只使用其 `Plane` 平面贴图逻辑**
  - **不要把球体渲染截图本身当页面素材**

### Pick B — Circular Metal Reference
- `ambientCG Metal051A`
- Link: `https://ambientcg.com/view?id=Metal051A`
- Why:
  - 标签含 `Brushed Circular Metal`
  - 虽然不是金色，但很适合当放射结构参考
  - 后续前端或设计阶段可统一偏金调色

### Pick C — Circular Metal Variant
- `ambientCG Metal051B`
- Link: `https://ambientcg.com/view?id=Metal051B`
- Why:
  - 同系列变体，可对比放射纹理密度
  - 相比某些更强高光版本，更容易压成 UI 小卡

### Pick D — Higher Contrast Variant
- `ambientCG Metal051C`
- Link: `https://ambientcg.com/view?id=Metal051C`
- Why:
  - 同系列高对比版本
  - 如果想让右侧高光更明显，可以再回来看这一张

### My Recommendation
- 第一选择仍是 `TextureCan 423`
- 但前提是：**只取它的平面材质，不用球体预览**
- 如果你希望更稳、更“平”，就选 `ambientCG Metal051A`

## 4) Metal Badge Reference

### Pick A — Best Starting Point
- `TextureCan Gold Coin 3D Model`
- Link: `https://www.texturecan.com/models/details/547/`
- Why:
  - 适合做金属徽章 / 圆 coin badge 的母体参考
  - 自带 Blender / FBX / glTF

### Pick B — Secondary Reference
- `TextureCan Gold Bar / Bullion / Ingot`
- Link: `https://www.texturecan.com/models/details/530/`
- Why:
  - 虽然不是圆徽章，但适合建立金属材质与边缘语言

### Pick C — Texture Reference
- `TextureCan Gold Coin Texture with Coin Edge Pattern`
- Link: `https://www.texturecan.com/details/255/`
- Why:
  - 更适合 coin edge、币面、压纹参考
  - 可辅助做 badge 的边缘细节

### My Recommendation
- 徽章参考先看 `Gold Coin 3D Model`
- 最终项目里仍建议做成统一的一套 PNG / WebP badge 资产

## Licensing / Official Source References
- `ambientCG License`
  - `https://docs.ambientcg.com/license/`
  - 官方说明：`CC0 1.0`
- `Poly Haven License`
  - `https://polyhaven.com/license`
  - 官方说明：`CC0`
- `TextureCan Terms`
  - `https://www.texturecan.com/terms/`
  - 官方说明：`CC0 1.0`
- `cgbookcase`
  - `https://www.cgbookcase.com/`
  - 首页说明：`100% free, no restrictions`

## Recommended Decision Path
1. 你先从每类里各选 `1` 个。
2. 我按这 `4` 个正式定义页面接入方案。
3. 如果你愿意再补一批：
   - `3D number`
   - `plus button badge`
   - `status card border frame`

## Notes About Fetching
- 目前我已经完成搜索和 shortlist。
- 如果你要我继续“把最终二进制素材拉到项目里”，最稳的方式有两个：
  - 你下载后发我 / 放到本地目录
  - 你给我明确素材 URL，我再继续处理
- 我现在最适合做的是：搜索、筛选、命名、规划接入。

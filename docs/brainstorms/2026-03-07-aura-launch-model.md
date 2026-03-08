# Brainstorm: AURA 上线前挖矿、NFT 分红与首发流动性方案

**Date**: 2026-03-07
**Status**: Ready for Planning

## Executive Summary

这是一个基于 BNB Chain 的上线前增长挖矿模型：用户通过 DApp 链上签到并存入 `3 USDT`，在代币正式上线前累计 `AURA` 奖励；推广关系驱动额外奖励；`NFT` 在上线前由第三方资金提供临时周度 `USDT` 补贴，上线后改为分享交易税分红。

这个模型可落地，但必须建立在三个架构前提上：一是使用带硬顶约束的链上内部记账而不是立即转币；二是使用协议控制的 `USDT` 结算地址与周度结算账本，而不是人工钱包打款；三是将首发流动性设计为可替换模块，在测试后再决定采用“自定义启动池”还是“标准池 + treasury 管理”。

## Idea Evolution

### Original Concept

原始设想是一个“3U 挖矿 + 推广 + NFT 分红 + 交易税回购/销毁”的组合型项目：用户每日做 `3U` 操作得 `1000 AURA`，直推奖励 `10%`，间推奖励 `5%`；工作室通过完成有效推广获得 `NFT`；交易税的一部分回购和分红。

### Refined Understanding

经过澄清后，当前版本已经明确为：

- `3U签到` 行为是用户通过合约存入 `3 USDT`，每次签到累计 `1000 AURA`
- 签到次数不限时间，但总发放必须受全局硬顶控制
- 一个地址每累计 `20` 次签到，算 `1` 个有效推广单位；同一地址允许重复累计
- `NFT` 仅在上线前通过推广赠送，达到 `200` 个有效推广送 `1` 张，最多 `100` 张，未送完即销毁或不可再 mint
- 上线前 `NFT` 的周度 `30 USDT` 来源于第三方资金；上线后改为交易税的 `60%` 分红
- 上线前所有 `AURA` 只做链上内部记账，不可转出；上线当天才开放 claim，并从该日开始计算提币手续费阶梯
- 首发流动性保留两条路线并行验证：自定义 AMM 首发后迁移标准池，或标准池 + treasury 主导的流动性/回购操作

### Key Clarifications Made

- `AURA` 的“10 亿总量”必须通过合约硬顶表达，而不是口头约束
- “有效推广”当前更接近“持续付费活跃度”而不是“去重后的新增用户数”
- 上线前的 `NFT` 周度收益不是永久固定收益，而是推广阶段的临时补贴
- 上线前奖励结算、上线后税收分红、以及流动性启动机制必须拆成独立模块处理

## Analysis Results

### Strengths (Yellow Hat)

- 日常操作足够简单，`3 USDT -> 1000 AURA` 的心智模型很强，便于快速传播。
- 上线前只做内部记账，可以避免代币未开盘就流入场外二级市场。
- 推广达标赠送 `NFT`，使工作室推广和后续税分红形成明确的权益锚点。
- 如果把“奖励记账”“USDT 结算”“流动性启动”拆成独立模块，后续可以单独替换高风险模块而不推翻整个系统。

### Risks & Concerns (Black Hat + Premortem)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 发放上限与上线前后配额没有链上保留，后期再人工调比例会破坏信任 | High | High | 在设计阶段先冻结总量桶位或至少冻结奖励桶位，并把可调整范围写入合约上限 |
| 同一地址允许重复累计有效推广，极易被工作室刷成“活动挖矿”而不是真实拉新 | High | Medium | 明确把该指标定义成“活跃贡献单位”，不要把它当新增用户 KPI；若需要真实拉新，追加唯一地址或唯一资金来源指标 |
| 上线前 `NFT` 周度 `30 USDT` 依赖第三方资金，若资金延迟就会立刻形成兑付风险 | High | High | 至少预注入数周预算，后台按周展示“应付/已付/缺口”，并设置暂停新赠送或暂停宣传的风控开关 |
| 自定义 AMM/Pair/Router 的复杂度、审计成本和兼容性风险很高 | Medium | High | 首发模块与核心奖励模块隔离；优先做双路线测试，未通过则退回标准池方案 |
| 交易税、回购、销毁、分红同时存在，会引来 MEV、抢跑、假量和分红套利 | High | High | 上线窗口使用私有 RPC 或 `MEV Guard`，设置初期限购/冷却/白名单，分红延迟到市场稳定后再启用 |
| 含税代币往往会破坏 DEX 周边工具兼容性 | Medium | High | 尽量让主 token 保持标准 ERC-20 行为，把复杂结算逻辑放到外部 treasury/distributor |
| `NFT` 分红、第三方收益、推广奖励、市值管理共同出现，法律和合规风险非常高 | High | High | 不做“永久固定收益”宣传，尽快做专业法律意见，先把上线前补贴与上线后税分红在合约和文案上明确拆开 |

### Gaps Identified

- [ ] **总量分桶尚未冻结** - 建议把挖矿、直推、间推、团队、流动性、合作、销毁缓冲至少做成显式桶位或上限区间。
- [ ] **上线流动性方案尚未定稿** - 建议先为 `A`/`B` 两条路线定义统一测试指标，再决定正式上线方案。
- [ ] **周度结算公式还不够细** - 建议把“应付金额、已支付金额、可领取金额、未到账缺口”定义成 epoch 账本结构。
- [ ] **权限边界未定义** - 建议明确哪些参数可改、谁可改、是否需要 timelock、是否允许 emergency pause。
- [ ] **安全验证计划未定义** - 建议在正式实现前就规划单元测试、仿真、审计与主网上线预案。

### Enhancement Opportunities (SCAMPER)

- **Substitute**: 用“周度 epoch claim”替代“逐笔自动分发”，降低 gas 和出错面。
- **Combine**: 把推广数据、NFT 资格、周度应付结算统一进同一个后台看板。
- **Adapt**: 借鉴 DEX 私有订单流和启动期限购机制，减少抢跑与三明治。
- **Modify**: 把上线前 `30 USDT/周` 从“固定承诺”改为“预算上限内的推广补贴”会更稳。
- **Put to other use**: 签到历史还能作为白名单、空投分层、社区等级系统的输入。
- **Eliminate**: 去掉“管理团队上线前再自由调配比例”的模糊空间，避免把核心信任点留给人工判断。
- **Reverse**: 可以反过来先做标准池首发，把自定义 AMM 仅作为备选实验，而不是默认长期运行。

### Premortem Findings

- **Failure mode**: 第三方资金断供，`NFT` 周度补贴无法按时到位 -> **Prevention**: 预存多周预算，后台公开缺口，设置自动暂停新增权益承诺
- **Failure mode**: 少量工作室用极少地址反复签到拿走大部分 `NFT` -> **Prevention**: 把这套机制明确定义为“活跃度挖矿”，并把真实拉新统计与其分开
- **Failure mode**: 自定义启动池上线即被攻击或兼容性翻车 -> **Prevention**: 保持双方案测试，未过门槛就回退到标准池
- **Failure mode**: 含税代币让外部工具、聚合器、Zap、限价单支持异常 -> **Prevention**: 简化主 token 行为，把分红和补贴逻辑迁到外部结算模块
- **Failure mode**: 上线后团队继续高频改参数，被市场视为强控盘 -> **Prevention**: 多签 + timelock + 参数上限 + 公开变更日志

## Structured Concept

### Component 1: Reward Ledger Contract
**Purpose**: 记录用户签到、推广奖励和上线前可见不可提的 `AURA` 余额。  
**Scope**: 接收 `3 USDT`，累计 `1000 AURA`/次，处理直推 `10%`、间推 `5%`，并执行全局硬顶。  
**Dependencies**: `USDT` 合约、推广关系映射、launch 状态。  
**Key Decisions**: 使用内部记账直到上线后开放 claim。

### Component 2: Referral & NFT Qualification Engine
**Purpose**: 统计有效推广单位并控制 `NFT` 赠送资格。  
**Scope**: 按“同一地址每 `20` 次签到 = `1` 有效推广单位”累计，满 `200` 单位赠送 `1 NFT`，最多 `100` 张，仅上线前有效。  
**Dependencies**: 签到记录、用户与推广者绑定关系、NFT mint 控制器。  
**Key Decisions**: 当前设计接受“重复同地址累计”，因此这更像活动挖矿而不是去重拉新。

### Component 3: Settlement Treasury & Epoch Distributor
**Purpose**: 接收上线前第三方 `USDT` 和上线后税收分红，并按周结算。  
**Scope**: 维护每周应付、已付、可领、未到账缺口，支持 `NFT` 持有人 pull claim。  
**Dependencies**: treasury 地址、后台看板、NFT 所有权快照或周度受益人清单。  
**Key Decisions**: 不采用人工钱包转账作为主流程。

### Component 4: AURA Token & Tax Module
**Purpose**: 负责正式上线后的 `AURA` 发行、claim、交易税、回购与销毁。  
**Scope**: 上线后开放 claim；税收路由到 treasury、回购模块或销毁模块；提币手续费阶梯从上线日开始计时。  
**Dependencies**: 主 token、claim 网关、treasury、launch 时间锚点。  
**Key Decisions**: 主 token 应尽量保持标准化，复杂分红逻辑外置。

### Component 5: Launch Liquidity Module
**Purpose**: 负责首发价格发现、早期反攻击和后续迁移。  
**Scope**: 路线 `A` 为自定义启动池后迁移标准池；路线 `B` 为标准池 + treasury 流动性/回购管理。  
**Dependencies**: DEX 路由、LP 持有方式、启动参数、测试结果。  
**Key Decisions**: 最终正式上线方案仍待测试决定。

### Component 6: Admin & Ops Layer
**Purpose**: 管理多签、参数、暂停、资金注入和公开看板。  
**Scope**: 限权、timelock、launch flag、周度结算发布、异常暂停。  
**Dependencies**: 多签钱包、监控、后台系统。  
**Key Decisions**: 需要把“能改什么”和“谁能改”写成清单，而不是留给运营口径解释。

## Research Findings

### External Best Practices

- OpenZeppelin 的 `ERC20Capped` 明确支持“mint 时强制总量硬顶”，适合作为 `10 亿` 总量约束的基础；但你仍需要把“已累计未 claim”也纳入配额保留。[OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/5.x/api/token/ERC20#ERC20Capped)
- OpenZeppelin 的 `PaymentSplitter` 适合 pull-based 分账，但 shares 在部署时固定，且官方明确提醒对 rebasing / fee-on-transfer token 可能不按预期工作，因此不适合你的动态周度结算场景。[OpenZeppelin Finance](https://docs.openzeppelin.com/contracts/4.x/api/finance#PaymentSplitter)
- OpenZeppelin 建议将高权限账号放到 multisig 或治理层，而不是长期用单个 EOA 持有，适合 treasury、pause、launch、参数更新等权限。[OpenZeppelin Access Control](https://docs.openzeppelin.com/contracts/5.x/access-control)
- PancakeSwap 官方提供 `MEV Guard`，目标就是在 BNB Chain 上减少 frontrun 风险，适合作为启动期前端默认交易入口之一。[PancakeSwap MEV Guard](https://docs.pancakeswap.finance/trading-tools/pancakeswap-mev-guard)
- PancakeSwap 的 Zap 文档明确提示某些带转账手续费的 token 不受支持，这说明含税 token 会带来工具兼容性成本。[PancakeSwap Zap V2](https://docs.pancakeswap.finance/earn/pancakeswap-pools/zap/zap-v2)
- Uniswap v2 白皮书强调通过最小化“持有 LP 资金的核心合约”中的逻辑来降低攻击面，这对“是否长期维护自定义 AMM”是一个直接提醒。[Uniswap v2 Core Whitepaper](https://docs.uniswap.org/whitepaper.pdf)
- Uniswap 2025 年的 Liquidity Launchpad 白皮书指出，空投和早期分发机制经常被 Sybil farmer 利用并在 claim 后快速抛售，这与你当前“同地址重复累计有效推广”的偏差风险高度相关。[Uniswap Liquidity Launchpad](https://docs.uniswap.org/assets/files/whitepaper_cca-fc8b989c3a5b11f6fcd199f6c6837a77.pdf)
- 美国 SEC 的数字资产分析框架把“利润预期”“分红/分配权利”“项目方支持市场价格”“项目方持续管理”都列为重要风险信号；FTC 对多层奖励和招募驱动结构也有明确风险提示。这部分不是法律意见，但足够说明你需要尽早做专业合规评估。[SEC Framework](https://www.sec.gov/files/dlt-framework.pdf) [FTC MLM Guidance](https://www.ftc.gov/business-guidance/resources/business-guidance-concerning-multi-level-marketing)

### Anti-Patterns to Avoid

- 不要把上线前关键收益依赖人工钱包逐笔打款。
- 不要让 “10 亿总量” 只存在于文案里，而不在合约里表达。
- 不要把“活动活跃度”包装成“真实新增用户”。
- 不要在未审计前把复杂自定义 AMM 当成长期基础设施。
- 不要把含税逻辑塞到所有转账路径里却不做 DEX/聚合器兼容性测试。

### Codebase Context

- 当前仓库只有需求草案文件：[requirement.md](/Users/ygg/vs/ai/3U/requirement.md)
- 尚无现成实现可复用，因此后续计划应按“从规范到架构再到实现”的顺序推进

## Architectural Decisions

### Documented ADRs

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](../decisions/ADR-0001-use-internal-accrual-ledger-until-launch.md) | Use internal accrual ledger until token launch | Accepted |
| [ADR-0002](../decisions/ADR-0002-use-protocol-controlled-weekly-usdt-settlement.md) | Use protocol-controlled weekly USDT settlement | Accepted |

### Pending Decisions (not yet documented)

- **首发流动性最终方案**: `A` 自定义启动池后迁移标准池，还是 `B` 标准池 + treasury 管理；需要先定义测试胜出标准
- **总量分桶与可调边界**: 哪些比例是固定的，哪些只允许在上限内调整
- **上线后税收分红的结算粒度**: 实时、按日、按周，还是按 epoch 聚合
- **是否为“真实拉新”增加额外指标**: 当前机制默认接受重复同地址累计

## Recommended Next Steps

1. 先把 `AURA` 总量分桶、奖励上限、管理员可调边界写成明确表格。
2. 把核心系统拆成 6 个模块：签到记账、推广/NFT、结算 treasury、主 token/claim、首发流动性、后台权限。
3. 为首发流动性路线 `A`/`B` 设计统一测试指标，包括安全性、兼容性、滑点、MEV 暴露和运营复杂度。
4. 在实现前先出一版合约接口草案和状态机图，避免把奖励、结算、启动逻辑写死在一个合约里。
5. 在任何公开推广前完成法律/合规和安全审计路线规划。

## Ready for Create-Plan

**Yes**

**If Yes**: 这个概念已经足够清晰，可以进入实现规划。

### Suggested Plan Scope

建议 `create-plan` 重点覆盖以下内容：

- 主要交付物：合约架构、DApp 前后台、运营看板、上线测试方案
- 关键阶段：需求冻结、状态机/接口设计、奖励与结算合约、启动流动性 PoC、权限与安全设计、测试与审计准备
- 成功要素：总量硬顶可验证、周度结算可审计、上线路径可回退、管理权限最小化、对外文案与合约行为一致

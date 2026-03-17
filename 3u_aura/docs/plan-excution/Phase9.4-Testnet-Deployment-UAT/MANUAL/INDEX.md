# Manual UAT 目录索引 (fork-anvil)

本文档列出所有手工 UAT 测试路径。

---

## 目录结构

```
MANUAL/
├── INDEX.md                      # 本文件
├── UAT-PurchasedNftFlow/         # 已购买 NFT 流程
│   ├── GUIDE.md
│   └── BUGS.md
├── UAT-ReferralNftFlow/         # 推荐人 NFT 流程 (关键缺口)
│   ├── GUIDE.md
│   └── BUGS.md
├── UAT-CheckinFlow/             # 每日签到流程
│   └── GUIDE.md
└── UAT-WeeklyRollover/          # 周结算 Roll over 流程
    └── GUIDE.md
```

---

## 测试覆盖矩阵

| 流程 | 自动化的 | 手工的 | 状态 |
|------|----------|--------|------|
| 登录 (dapp/admin) | ✅ | - | 已自动化 |
| Bind + Placement | ✅ | - | 已自动化 |
| Check-in | ✅ | ✅ | 已自动化 + 文档 |
| 购买 NFT | ✅ | ✅ | 已自动化 + 文档 |
| Referral NFT 审批 | ❌ | ✅ | **需手工测试** |
| Weekly Rollover | ✅ | ✅ | 已自动化 + 文档 |
| Lottery | ✅ | - | 已自动化 |
| Ranking | ✅ | - | 已自动化 |
| Merkle Claim | ✅ | - | 已自动化 |

---

## 快速开始

### 启动环境

```bash
cd apps/e2e/phase94
PROMOTION_ENV=fork-anvil pnpm run stack:start
PROMOTION_ENV=fork-anvil pnpm run fork:start
```

### 选择测试流程

1. **购买 NFT** → `UAT-PurchasedNftFlow/GUIDE.md`
2. **推荐人 NFT 审批** → `UAT-ReferralNftFlow/GUIDE.md` ⭐
3. **签到** → `UAT-CheckinFlow/GUIDE.md`
4. **周结算 Roll over** → `UAT-WeeklyRollover/GUIDE.md`

---

## 钱包 (fork-anvil)

| 角色 | 地址 | 私钥 |
|------|------|------|
| admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| referrer | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47eec8D283F825389114C4B0d3Ec617A6D6c792b` |
| userA | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| userB | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| userC | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x976ea74026e726554db657faa6272f2767d5be5a2b65de伤口8e5a6f9a0b3c0d` |

---

## 端点

- Server: http://127.0.0.1:3210
- DApp: http://127.0.0.1:3200
- Admin: http://127.0.0.1:3201
- Anvil RPC: http://127.0.0.1:18545

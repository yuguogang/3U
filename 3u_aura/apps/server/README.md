# ARB 跨平台对冲交易系统 - 快速起步指南

本指南旨在帮助您在几分钟内完成从环境搭建到策略执行的全过程。

## 1. 基础设施要求

系统基于 NestJS 构建，依赖以下核心基础设施：

- **MySQL (MariaDB)**: 用于存储策略配置、历史行情、资金费率及成交记录。
- **Redis**: 用于 BullMQ 任务队列（执行信号发现及下单逻辑）。
- **Node.js**: v18+ 推荐使用 pnpm。

### 环境变量配置
在 `apps/server` 目录下创建 `.env` 文件：
```env
DATABASE_URL="mysql://root:root@localhost:3306/arb_test"
REDIS_URL="redis://localhost:6379"
# 交易 API (可选，mock 模式下不需要)
BINANCE_API_KEY=""
BINANCE_API_SECRET=""
OKX_API_KEY=""
OKX_API_SECRET=""
OKX_PASSPHRASE=""
MARKET_DATA_SYNC_ENABLED="false"
REPLAY_PREWARM_ENABLED="false"
REPLAY_PREWARM_CONCURRENCY="1"
REPLAY_ROLLING_PREWARM_ENABLED="false"
REPLAY_LEG_BATCH_SIZE="200"
REPLAY_PER_SYMBOL_MODE="true"
REPLAY_QUEUE_DELAY_MS="0"
REPLAY_SIGNAL_ONLY="false"
REPLAY_VIRTUAL_BALANCE_ENABLED="false"
REPLAY_VIRTUAL_LEVERAGE="10"
```

---

## 2. 基础设施要求 (续)：区域代理配置

如果您所在的区域无法直接访问 Binance 或 OKX 的 API（例如下载行情数据时），您需要在 `.env` 中配置代理：

1. 打开 `apps/server/.env`。
2. 取消以下行的注释并指向您的本地代理地址（如 Clash）：
   ```env
   HTTPS_PROXY="http://127.0.0.1:7890"
   HTTP_PROXY="http://127.0.0.1:7890"
   ```
3. 系统在开发模式 (`NODE_ENV=development`) 下会自动识别并通其加载数据。

---

# 3. 一键初始化环境
目前系统支持一键全自动初始化，推荐直接使用脚本：

```bash
# 自动完成：依赖安装 -> 数据库迁移 -> 种子注入 -> 三个核心合约数据补全 -> 自动信号重放
chmod +x setup.sh
./setup.sh
```

---

## 4. 手动分布步骤（可选）
如果您希望手动控制流程：

1. **执行数据库迁移**（创建表结构）：
   ```bash
   pnpm run db:migrate
   ```

2. **初始化策略数据**:
   ```bash
   pnpm run db:seed
   ```

---

## 5. 手动数据准备：行情与资金费率下载
*(如果您已运行 setup.sh，请跳过此步骤)*

系统需要历史行情数据来进行信号计算。请按以下顺序执行 `curl` 命令（假设服务运行在 4000 端口）：

### 批量下载数据（从 2026-02-01 开始）

该命令将自动下载 Binance 和 OKX 所有共同合约的价格及资金费率。

**方式 A：推荐方式（下载指定资产，速度快）**
```bash
curl -X POST http://localhost:4000/api/v1/arb/market-data/batch-download \
  -H "Content-Type: application/json" \
  -d '{
    "from": "2026-02-01T00:00:00Z",
    "contracts": ["TRX", "BTC", "ETH"]
  }'
```

**方式 B：全量下载（下载所有共识资产，耗时较长）**
```bash
curl -X POST http://localhost:4000/api/v1/arb/market-data/batch-download \
  -H "Content-Type: application/json" \
  -d '{
    "from": "2026-02-01T00:00:00Z"
  }'
```

---

## 4. 离线重放：生成模拟订单

重放功能会模拟从指定时间开始的历史行情，触发开仓、平仓及资金费结算信号，并生成模拟成交记录。

```bash
curl -X POST http://localhost:4000/api/v1/arb/replay/start \
  -H "Content-Type: application/json" \
  -d '{
    "strategyId": "65d5798e-3fa8-46ef-b1b6-fb2027287090",
    "from": "2026-02-01T00:00:00Z"
  }'
```

---

## 5. 自动运行机制 (Tick/Cron)

系统内置了自动同步和计算机制，并具备 **Replay 优先守卫**：

- **互斥机制**: 当系统正在执行 `replay/start`（历史信号重放）时，所有的定时任务会自动挂起，避免历史数据与实时数据发生冲突。
- **每分钟 (Tick)**: 自动执行 `MarketDataSyncService`。如果策略已启用且不再重放状态，它会同步最新价格。
- **信号生成**: `SignalEngineService` 每分钟检查一次。同样在重放结束后才会接管信号计算。

### 查看系统状态
```bash
# 查看当前重放状态
curl http://localhost:4000/api/v1/arb/replay/status

# 查看信号统计
curl "http://localhost:4000/api/v1/arb/signals/stats?strategyId=65d5798e-3fa8-46ef-b1b6-fb2027287090"
```

---

## 💡 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm run start:dev` | 启动开发服务 (带热更新) |
| `pnpm run build` | 编译项目 |
| `pnpm run start:prod` | 启动生产模式服务 |
| `pnpm run db:migrate` | 执行数据库迁移 |
| `pnpm run db:seed` | 初始化策略种子数据 |
| `pnpm run lint` | 执行代码检查 |
| `pnpm test` | 运行单元测试 |

---

## 🛠 API 分类列表

### 1. 历史重放 (Replay) - `/api/v1/arb/replay`
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/start` | POST | 启动历史信号回放 |
| `/status` | GET | 查看重放进度 |
| `/stop` | POST | 停止重放任务 |

### 2. 行情数据 (Market Data) - `/api/v1/arb/market-data`
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/batch-download` | POST | 批量下载 Binance/OKX 共同合约数据 |
| `/backfill` | POST | 指定策略的历史数据回填 |
| `/prices` | POST | 查询已存的历史价格记录 |
| `/funding-rates` | POST | 查询已存的资金费率记录 |

### 3. 策略管理 (Strategy) - `/api/v1/arb/strategy`
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/` | GET | 获取所有策略列表 |
| `/init-universal` | POST | 初始化通用对冲策略 (自动发现资产) |
| `/:id/toggle` | POST | 启用或禁用特定策略 |
| `/:id/hedge-filter` | POST | 更新资产过滤名单 (白名单模式) |
| `/:id/active-positions` | GET | 查看当前策略的逻辑持仓情况 |

### 4. 信号监控 (Signal) - `/api/v1/arb/signals`
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/stats` | GET | 全局信号统计 (收益、次数等) |
| `/list` | POST | 查询信号记录 (OPEN/CLOSE/FUNDING) |
| `/latest` | GET | 获取最近生成的信号 |
| `/queue/stats` | GET | 查看 BullMQ 任务队列详情 |
| `/retry/:queueId` | POST | 重试失败的信号任务 |

### 5. 交易会话 (Session) - `/api/v1/arb/sessions`
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/active` | GET | 查看当前所有活跃的对冲会话 |
| `/:sessionId` | GET | 获取特定会话的完整生命周期详情 |
| `/positions/core` | GET | 查看 Mock 交易所底层的实时总仓位 |

### 6. 插件适配器 (Adapter) - `/api/v1/arb/adapter`
*主要服务于浏览器插件，模拟真实交易所 API 响应*

#### Binance (BAPI/FAPI 模拟)
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/binance/user-position` | GET | 模拟 BAPI 实时持仓 |
| `/binance/user-balance` | GET | 模拟 BAPI 资产余额 |
| `/binance/wallet-balance` | GET | 模拟 BAPI 钱包详细列表 |
| `/binance/position-history` | GET | 模拟 BAPI 历史平仓记录 |
| `/binance/trade-history` | GET | 模拟 BAPI 成交明细记录 |
| `/binance/order-history` | GET | 模拟 BAPI 历史订单记录 |
| `/binance/open-orders` | GET | 模拟 BAPI/FAPI 当前挂单记录 |
| `/binance/transaction-history`| GET | 模拟 BAPI 资金流水记录 |

#### OKX (V5 模拟)
| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/okx/positions` | GET | 模拟 V5 实时持仓 |
| `/okx/balance` | GET | 模拟 V5 账户余额 (简版) |
| `/okx/balance-detail` | GET | 模拟 V5 账户余额 (详情) |
| `/okx/account-summary` | GET | 模拟 V5 账户总览 |
| `/okx/position-history` | GET | 模拟 V5 历史仓位记录 |
| `/okx/orders-history` | GET | 模拟 V5 历史订单记录 |

# Testnet MockUSDT Epoch #1 Ticket Recovery Execution Log

## Status

Epoch #1 remote DB recovery completed. `WeeklyEpoch` `cmne80qp900008wpj44hy91qv` is now back in `CALCULATING` and ready for weekly settlement draft/publish.

## Evidence Collected

- Verified `epoch #1` current state on remote test DB:
  - `status = CANCELLED`
  - `participantCount = 1`
  - `qualifiedTicketCount = 1`
  - `calculationRemark = ROLLOVER_TO:cmnhv14z80p4z8wpj8jn7v87w`
- Verified `epoch #2` currently holds rollover amount:
  - `rolloverUsdt = 1646100000`
- Verified raw `Checkin` counts for `2026-03-27` through `2026-04-02`:
  - `52` users with any check-in
  - `36` users with at least `7` confirmed check-ins
- Executed remote DB repair using the provided Postgres credentials:
  - patched `UserDailyStat.countedCheckinDays` from raw `checkinTimes` for `2026-03-27` through `2026-04-02`
  - recalculated `LotteryTicket` eligibility for `epoch #1` from confirmed check-in counts using `floor(confirmed_count / 7)`
  - preserved existing `isParticipating` flags and recomputed weekly epoch counts from repaired ticket rows
  - reverted `epoch #2.rolloverUsdt` back to `0`
- Verified repaired `epoch #1` state:
  - `status = CALCULATING`
  - `participantCount = 14`
  - `qualifiedTicketCount = 36`
  - `calculationRemark = RECOVERED_RAW_COUNT_RULE|READY_FOR_PHASE6:14|TOTAL_TICKETS:245`
  - `lotteryPoolUsdt = 1152270000`
  - `rankingPoolUsdt = 493830000`
  - `settledAt = null`
- Verified repaired `epoch #2` state:
  - `status = OPEN`
  - `rolloverUsdt = 0`
  - `lotteryPoolUsdt = 0`
  - `rankingPoolUsdt = 0`

## Commands Run

- Read-only code inspection commands
- Read-only remote DB queries using provided Postgres credentials
- Remote mutation attempt via inline Node script:
  - failed because `LotteryTicket.id` in this DB does not have a database default
  - transaction rolled back cleanly
- Remote mutation attempt via `/tmp/testnet_epoch1_recover.mjs`:
  - first run failed because `AdminAuditLog.id` in this DB also lacks a database default
  - transaction rolled back cleanly
- Successful remote mutation command:

```bash
/usr/local/bin/node /tmp/testnet_epoch1_recover.mjs
```

Successful output:

```json
{
  "success": true,
  "dailyProjectionRowsPatched": 77,
  "ticketRowsPatched": 52,
  "ticketRowsZeroed": 1,
  "qualifiedUserCount": 36,
  "participatingUserCount": 14,
  "totalTicketCount": 245,
  "epochs": [
    {
      "id": "cmne80qp900008wpj44hy91qv",
      "epochNo": 1,
      "status": "CALCULATING",
      "participantCount": 14,
      "qualifiedTicketCount": 36,
      "calculationRemark": "RECOVERED_RAW_COUNT_RULE|READY_FOR_PHASE6:14|TOTAL_TICKETS:245",
      "rolloverUsdt": "0",
      "lotteryPoolUsdt": "1152270000",
      "rankingPoolUsdt": "493830000",
      "settledAt": null
    },
    {
      "id": "cmnhv14z80p4z8wpj8jn7v87w",
      "epochNo": 2,
      "status": "OPEN",
      "participantCount": 0,
      "qualifiedTicketCount": 0,
      "rolloverUsdt": "0",
      "lotteryPoolUsdt": "0",
      "rankingPoolUsdt": "0",
      "settledAt": null
    }
  ]
}
```

- Live API probe:

```bash
curl -i -sS -X POST https://api.goldmint.vip/api/v1/admin/ops/settlement/weekly/draft \
  -H 'Content-Type: application/json' \
  --data '{"epochNo":1}'
```

Result:
- `404 Not Found`
- `api.goldmint.vip` currently does **not** expose the new weekly settlement draft/publish admin routes.

- Remote weekly settlement draft attempts:
  - direct `settle-weekly-epoch-rewards.ts --mode draft` via `tsx` failed because Nest `ConfigService` injection metadata was lost in that runner
  - direct `settle-weekly-epoch-rewards.ts --mode draft` via `ts-node` reached business logic but rolled back with Prisma interactive transaction timeout `P2028` after ~`8.1s`

- Temporary long-timeout helper script added for the recovery execution:
  - [apps/server/.tmp/testnet_weekly_rewards_long_tx.ts](/Users/ygg/vs/ai/3U/3u_aura/apps/server/.tmp/testnet_weekly_rewards_long_tx.ts)
  - purpose: monkey-patch `TransactionOrchestratorService.run` to use `maxWait=120000` and `timeout=120000` for this recovery-only settlement execution

- Successful draft command:

```bash
PATH=/usr/local/bin:$PATH \
PROMOTION_ENV=testnet-mockusdt \
DATABASE_HOST=47.236.39.50 \
DATABASE_PORT=5432 \
DATABASE_USER=postgres \
DATABASE_PASSWORD=change-me \
CACHE_URL=redis://47.236.39.50:6379/11 \
THROTTLER_REDIS=redis://47.236.39.50:6379/12 \
BULL_HOST=47.236.39.50 \
BULL_PORT=6379 \
/usr/local/bin/node scripts/promotion-env/run-with-env.mjs --target server -- \
  /usr/local/bin/pnpm --dir apps/server exec ts-node --project tsconfig.json -r tsconfig-paths/register \
  .tmp/testnet_weekly_rewards_long_tx.ts --epoch-id cmne80qp900008wpj44hy91qv --mode draft
```

Draft result:

```json
{
  "dateKeyFromInclusive": "2026-03-27",
  "dateKeyToExclusive": "2026-04-03",
  "epochId": "cmne80qp900008wpj44hy91qv",
  "lottery": {
    "consolationCount": 7,
    "draftRewardCount": 14,
    "lotteryRolloverUsdt": "0"
  },
  "merkle": {
    "claimCount": 8,
    "leafCount": 8,
    "merkleRoot": "0x399b247ee8a9de8d7dec37bf6d340fe767aae328d42c115460b627508d3dcf06"
  },
  "mode": "draft",
  "ranking": {
    "draftRewardCount": 1,
    "rankingRolloverUsdt": "370372500"
  }
}
```

- Successful publish command:

```bash
PATH=/usr/local/bin:$PATH \
PROMOTION_ENV=testnet-mockusdt \
DATABASE_HOST=47.236.39.50 \
DATABASE_PORT=5432 \
DATABASE_USER=postgres \
DATABASE_PASSWORD=change-me \
CACHE_URL=redis://47.236.39.50:6379/11 \
THROTTLER_REDIS=redis://47.236.39.50:6379/12 \
BULL_HOST=47.236.39.50 \
BULL_PORT=6379 \
/usr/local/bin/node scripts/promotion-env/run-with-env.mjs --target server -- \
  /usr/local/bin/pnpm --dir apps/server exec ts-node --project tsconfig.json -r tsconfig-paths/register \
  .tmp/testnet_weekly_rewards_long_tx.ts --epoch-id cmne80qp900008wpj44hy91qv --mode publish
```

Publish result:

```json
{
  "consolationCount": 7,
  "epochId": "cmne80qp900008wpj44hy91qv",
  "lotteryRolloverUsdt": "0",
  "merkle": {
    "claimCount": 8,
    "merkleRoot": "0x399b247ee8a9de8d7dec37bf6d340fe767aae328d42c115460b627508d3dcf06"
  },
  "mode": "publish",
  "nextEpochId": "cmnhv14z80p4z8wpj8jn7v87w",
  "rankingRolloverUsdt": "370372500"
}
```

- Post-publish read-only verification:
  - `epoch #1` still `CALCULATING`
  - `epoch #1.calculationRemark = RECOVERED_RAW_COUNT_RULE|READY_FOR_PHASE6:14|TOTAL_TICKETS:245|PUBLISH_PREPARED`
  - `epoch #1` weekly reward rows:
    - `LOTTERY_USDT = 7`
    - `RANKING_USDT = 1`
    - `CONSOLATION_AURA = 7`
  - `epoch #1` merkle leaves = `8`
  - `epoch #1` claim draft rows:
    - `MERKLE_LOTTERY = 7`
    - `MERKLE_RANKING = 1`
  - `epoch #2.rankingPoolUsdt = 370372500`

- Operational caveat discovered during local-against-remote execution:
  - remote Redis requires auth for the configured databases and the current manifest/local override set did not include the password
  - this caused repeated `ioredis NOAUTH Authentication required` noise after the transaction already committed
  - the recovery commands were manually terminated after confirmed `COMMIT`

## Pending

- Chain-side merkle root publication for `epoch #1` using the root publisher wallet
- Reward activation after the on-chain root is published
- Separate NFT subsidy publication path
- Modified code deployment / follow-up tests for the intended “7 check-ins per ticket tranche” behavior

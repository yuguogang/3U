# Manual UAT Guide - Weekly Rollover Flow (fork-anvil)

This guide provides instructions for manually testing the **below-threshold weekly rollover** flow in the **`fork-anvil`** local environment.

---

## 1. Environment Setup

### Start Services

```bash
cd apps/e2e/phase94
PROMOTION_ENV=fork-anvil pnpm run stack:start
PROMOTION_ENV=fork-anvil pnpm run fork:start
```

**Endpoints:**
- Server: http://127.0.0.1:3210
- DApp: http://127.0.0.1:3200
- Admin: http://127.0.0.1:3201
- Anvil RPC: http://127.0.0.1:18545

### Wallets (Anvil Default Accounts)

| Role | Address | Private Key |
|------|---------|-------------|
| **admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

---

## 2. Test Concept

### Below-Threshold Rollover

When `participantCount < minimumParticipants` (12):
- The epoch should **roll over** to next week
- No lottery/ranking/merkle rewards are generated
- The promotion pool accumulates for next epoch

This is a **success path**, not a failure - the system correctly handles insufficient participation.

---

## 3. Test Steps

### Step 1: Find a Below-Threshold Epoch

1. Connect `admin` wallet to Admin Dashboard: `http://127.0.0.1:3201/dashboard`
2. Navigate to **Epoch Management** or **Weekly Epochs**
3. Look for an epoch with `participantCount < 12`
4. **Screenshot epoch details showing below-threshold**

### Step 2: Execute Epoch Sync

1. Click "Sync Epoch" or "Process Epoch" for the below-threshold epoch
2. Wait for processing to complete
3. **Record the sync result**

### Step 3: Verify Rollover

1. Check the epoch status
2. Verify `rolledOver: true`
3. Check next epoch's rollover pool
4. Verify no lottery/ranking rewards were generated
5. **Screenshot showing rollover confirmation**

---

## 4. API Verification (Optional)

### Preview Epoch Sync

```bash
curl -X POST http://127.0.0.1:3210/api/v1/admin/ops/epochs/sync/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_access_token>" \
  -d '{"referenceAt": "2026-03-18T00:00:00.000Z"}'
```

Expected for below-threshold:
```json
{
  "rolledOver": true,
  "participantCount": 5,
  "lotteryRewards": 0,
  "rankingRewards": 0
}
```

---

## 5. Expected Results

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find epoch | participantCount < 12 |
| 2 | Sync | Processing completes |
| 3 | Verify rollover | rolledOver=true, no rewards generated |

This is **expected behavior** - below-threshold epochs should rollover.

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find below-threshold epoch | Create one by having fewer than 12 users check-in |
| Rewards still generated | This is a bug - should be 0 for below-threshold |

# Manual UAT Guide - Check-in Flow (fork-anvil)

This guide provides instructions for manually testing the **daily check-in** flow in the **`fork-anvil`** local environment.

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
| **userB** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

### MetaMask Setup

1. **Add Custom Network:**
   - Network Name: `Local Anvil`
   - RPC URL: `http://127.0.0.1:18545`
   - Chain ID: `97`
   - Currency Symbol: `tBNB`

2. **Import Account:**
   - Import `userB` account using its private key.

---

## 2. Test Steps

### Step 1: UserB Submits Check-in

1. Connect `userB` wallet to DApp: `http://127.0.0.1:3200`
2. Navigate to `/checkin` page
3. Click "Check-in Now" or submit button
4. Confirm transaction in MetaMask
5. **Record the txHash**

### Step 2: Verify Check-in on Backend

```bash
curl -X GET http://127.0.0.1:3210/api/v1/user/profile \
  -H "Authorization: Bearer <userB_access_token>"
```

Expected:
- `totalCheckinCount` increased by 1
- `totalCheckinUsdt` increased by 3 USDT (if reward applicable)

### Step 3: Verify on Profile

1. Navigate to `/profile` page
2. Check check-in statistics
3. **Screenshot profile showing check-in count**

---

## 3. Expected Results

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit check-in | tx confirmed, txHash recorded |
| 2 | Verify backend | checkin count increased |
| 3 | Verify profile | UI shows updated stats |

---

## 4. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient balance" | Use `cast send` to mint more MockUSDT to userB |
| Check-in not counted | Ensure transaction was confirmed on-chain |

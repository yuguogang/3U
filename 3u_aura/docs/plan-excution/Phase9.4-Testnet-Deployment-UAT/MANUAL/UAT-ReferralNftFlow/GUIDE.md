# Manual UAT Guide - Referral NFT Flow (fork-anvil)

This guide provides instructions for manually testing the **Referral NFT eligibility → admin approval → mint** flow exclusively in the **`fork-anvil`** local environment.

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
| **userA** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **admin** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

### MetaMask Setup

1. **Add Custom Network:**
   - Network Name: `Local Anvil`
   - RPC URL: `http://127.0.0.1:18545`
   - Chain ID: `97`
   - Currency Symbol: `tBNB`

2. **Import Accounts:**
   - Import both `userA` and `admin` accounts using their private keys.

---

## 2. Prerequisites

Before testing Referral NFT flow, userA must have:
1. **Purchased NFT** - Complete the Purchased NFT flow first (see `UAT-PurchasedNftFlow/GUIDE.md`)
2. **Eligible for Referral NFT** - Based on promotion rules (e.g., team volume threshold)

If userA doesn't have a purchased NFT yet, start there first.

---

## 3. Test Steps

### Step 1: Verify userA has purchased NFT

1. Connect `userA` wallet to DApp: `http://127.0.0.1:3200`
2. Navigate to `/profile` page
3. Verify userA shows `hasPurchasedNft: true` or NFT count > 0
4. **Screenshot profile showing NFT ownership**

### Step 2: Check Referral NFT Eligibility

1. Navigate to `/nft` page
2. Look for "Referral NFT Eligibility" or "Eligible" status
3. The status should show as **ELIGIBLE** (if purchase criteria are met)
4. **Screenshot eligibility status**

### Step 3: Admin Approves Referral NFT

1. Connect `admin` wallet to Admin Dashboard: `http://127.0.0.1:3201/dashboard`
2. Navigate to **NFT Approvals** or **Eligibility Management** page
3. Find `userA` in the pending approvals list
4. Click **Approve** or **Grant** button
5. Confirm the transaction in MetaMask
6. **Record the approval txHash**
7. **Screenshot admin approval confirmation**

### Step 4: UserA Mints Referral NFT

1. Refresh userA's `/nft` page: `http://127.0.0.1:3200/nft`
2. Look for "Mint Referral NFT" or "Claim" button
3. Click the mint button
4. Confirm the transaction in MetaMask
5. **Record the mint txHash**
6. **Screenshot mint confirmation**

### Step 5: Verify Ownership

1. Navigate to `/profile` page: `http://127.0.0.1:3200/profile`
2. Verify NFT count has increased
3. **Screenshot profile showing total NFTs (purchased + referral)**

---

## 4. API Verification (Optional)

### Check Eligibility Status

```bash
curl -X GET http://127.0.0.1:3210/api/v1/nft-eligibility/current \
  -H "Authorization: Bearer <userA_access_token>"
```

Expected response:
```json
{
  "eligible": true,
  "status": "APPROVED",
  "nftType": "REFERRAL"
}
```

### Check NFT Holdings

```bash
curl -X GET http://127.0.0.1:3210/api/v1/user/profile \
  -H "Authorization: Bearer <userA_access_token>"
```

Expected: `hasPurchasedNft: true` and `nftCount >= 1`

---

## 5. Expected Results

| Step | Action | Expected Result | Screenshot |
|------|--------|----------------|------------|
| 1 | Verify purchased NFT | Profile shows NFT ownership | ✅ |
| 2 | Check eligibility | Status = ELIGIBLE | ✅ |
| 3 | Admin approves | Approval tx confirmed, status = APPROVED | ✅ |
| 4 | UserA mints | Mint tx confirmed | ✅ |
| 5 | Verify ownership | NFT count increased | ✅ |

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not Eligible" status | Ensure userA has completed required actions (purchase NFT, meet volume threshold) |
| Admin can't see pending list | Verify admin wallet is in adminAllowlistWallets |
| "Mint" button disabled | Ensure admin approval was completed |
| Eligibility stuck at PENDING | Check if purchase was synced to backend |

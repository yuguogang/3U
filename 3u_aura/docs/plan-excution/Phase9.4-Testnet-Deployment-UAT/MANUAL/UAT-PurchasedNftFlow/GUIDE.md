# Manual UAT Guide - Purchased NFT Flow (fork-anvil)

This guide provides instructions for manually testing the Purchased NFT flow exclusively in the **`fork-anvil`** local environment.

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

1.  **Add Custom Network:**
    -   Network Name: `Local Anvil`
    -   RPC URL: `http://127.0.0.1:18545`
    -   Chain ID: `97`
    -   Currency Symbol: `tBNB`

2.  **Import Accounts:**
    -   Import both `userA` and `admin` accounts using their private keys.

---

## 2. Test Steps

### Step 1: UserA Purchases NFT

1.  Connect `userA` wallet to the DApp: `http://127.0.0.1:3200`
2.  Navigate to the `/nft` page.
3.  Click "Approve 1000 USDT" and confirm in MetaMask.
4.  After approval, click "Buy Purchased NFT" and confirm the purchase.
5.  **Record the transaction hash (txHash)** from MetaMask activity.

### Step 2: Sync Purchase to Backend

This step is crucial for informing the backend database about the on-chain purchase.

```bash
# 1. Get the access token from DApp's Local Storage
# 2. Replace <userA_access_token> and <purchase_tx_hash> below

curl -X POST http://127.0.0.1:3210/api/v1/claims/purchased-nft/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <userA_access_token>" \
  -d '{"txHash": "<purchase_tx_hash>"}'
```

### Step 3: Verify Backend State & DApp UI

1.  **Check DApp:** Refresh the `/nft` page (`http://127.0.0.1:3200/nft`). The UI should now reflect that you own the NFT. (Note: This may require fixing Bug #3).
2.  **Check Database (Optional):** Query the `nftHolding` table to confirm a new record was created for `userA`.
3.  **Check Profile:** Visit the user profile page (`http://127.0.0.1:3200/profile`) and verify the NFT count is `> 0`.

---

## 3. Expected Results

-   **After Purchase:** The `Purchased supply left` count on the `/nft` page decreases.
-   **After Sync:** The `curl` command returns a success response, e.g., `{"hasPurchasedNft":true, ...}`.
-   **After Verification:** The user's profile and NFT-related pages correctly display the newly acquired asset.

---

## 4. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient balance" | The `fork-anvil` environment should provide enough funds. If not, use `cast send` to mint more MockUSDT. |
| "Sync failed" | Ensure the backend server is running on port `3210` and the `txHash` is correct for the current Anvil session. |
| "Buy button disabled" | This is a known bug (see `BUGS.md`). Refresh the page after approving. |

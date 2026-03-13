# ChainId 97 Deployment Manifest Template

## Network
- Chain ID: `97`
- Network Name: `BSC Testnet`
- RPC URL:
- Explorer Base URL:

## Roles
- Deployer Wallet:
- Owner Wallet:
- Finance Wallet:
- Referral Signer Wallet:
- Settlement Publisher Wallet:
- Root Publisher Wallet:
- Admin Allowlist Wallets:
- Test User Wallet A:
- Test User Wallet B:

## Addresses
- Payment Token / USDT:
- Check-in Receiver:
- FounderNFT:
- NFTSale:
- Settlement:
- MerkleClaim:

## Deployment Transactions
- FounderNFT deploy tx:
- NFTSale deploy tx:
- Settlement deploy tx:
- MerkleClaim deploy tx:
- Sale role bind tx:
- Ownership transfer tx:
- Publisher role set tx:

## Environment Wiring

### apps/contracts
- `PRIVATE_KEY`:
- `OWNER`:
- `USDT_ADDRESS`:
- `FINANCE_WALLET`:
- `REFERRAL_SIGNER`:
- `FOUNDER_NFT_ADDRESS`:
- `SETTLEMENT_PUBLISHER`:
- `ROOT_PUBLISHER`:
- `BSC_TESTNET_RPC_URL`:

### apps/server
- `PROMOTION_CLAIM_CHAIN_ID=97`
- `PROMOTION_RPC_URL`:
- `PROMOTION_REFERRAL_RPC_URL`:
- `PROMOTION_CHECKIN_RECEIVER_ADDRESS`:
- `PROMOTION_PAYMENT_TOKEN_ADDRESS`:
- `PROMOTION_NFT_SALE_ADDRESS`:
- `PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS`:
- `PROMOTION_SETTLEMENT_ADDRESS`:
- `PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY`:
- `ADMIN_ALLOWLIST_WALLETS`:

### apps/dapp
- `NEXT_PUBLIC_API_BASE_URL`:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`:
- `NEXT_PUBLIC_PROMOTION_CHAIN_ID=97`
- `NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS`:
- `NEXT_PUBLIC_NFT_SALE_ADDRESS`:
- `NEXT_PUBLIC_MERKLE_CLAIM_ADDRESS`:
- `NEXT_PUBLIC_SETTLEMENT_ADDRESS`:

### apps/admin
- `NEXT_PUBLIC_API_BASE_URL`:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`:

## UAT Checklist
- [ ] Wallet login works on dapp
- [ ] Wallet login works on admin
- [ ] Invite binding works
- [ ] Inviter-operated placement works
- [ ] Check-in payment and server verification work
- [ ] Purchased NFT buy works
- [ ] Referral NFT reaches `PENDING_APPROVAL`
- [ ] Admin approve works
- [ ] Referral NFT signer payload works
- [ ] Referral NFT mint works
- [ ] Merkle claim works
- [ ] Purchased subsidy claim works
- [ ] Claim sync-back works

## Notes
- Do not mark Phase9.4 completed without real txHash evidence.
- If any signer or publisher role is wrong, stop UAT and fix configuration first.

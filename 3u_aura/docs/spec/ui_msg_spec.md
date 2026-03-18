# 3U AURA DApp Message Specification (UI/UX Agent)

This document provides the API Data Transfer Objects (DTOs) and Smart Contract Function Signatures (ABI) required for the 3U AURA DApp UI/UX development.

---

## 1. Backend API Specification

The backend uses NestJS with Zod validation. All amounts are strings representing atomic units (e.g., USDT with 6 decimals).

### 1.1 Authentication (Auth)

#### Get Signature Message
**Endpoint**: `GET /api/auth/signature-message`
**Query Parameters**:
```typescript
{
  address: string;          // EVM wallet address
  scenario: 'signin' | 'admin'; // SignatureScenarios enum
}
```

#### Sign-in with Signature
**Endpoint**: `POST /api/auth/signin`
**Body**:
```typescript
{
  address: string;          // EVM wallet address
  signature: string;        // 0x prefixed hex signature
  device: 'mobile' | 'desktop' | string; // DEVICES enum
  name?: string;            // Optional device name
  chain?: number;           // Optional chain ID
}
```

### 1.2 Referral & Team

#### Bind Inviter (Invite Code)
**Endpoint**: `POST /api/referral/bind-inviter`
**Body**:
```typescript
{
  inviteCode: string;       // 1-32 character invite code
}
```

#### Bind Placement (Team Structure)
**Endpoint**: `POST /api/team/bind-placement`
**Body**:
```typescript
{
  placementUserId: string;  // ID of the user to be placed
  parentId: string;         // ID of the parent in the tree
  teamPosition: 1 | 2;      // 1 for Left, 2 for Right (TeamPosition enum)
}
```

### 1.3 Check-in

#### Submit Check-in Transaction
**Endpoint**: `POST /api/checkin`
**Body**:
```typescript
{
  chainId: number;          // Chain ID where tx occurred
  txHash: string;           // 0x prefixed 64-char hex
  payerAddress: string;     // Wallet address that paid
  tokenSymbol: string;      // Defaults to 'USDT'
  amountAtomic: string;     // Integer string (e.g., '1000000' for 1 USDT)
}
```

### 1.4 NFT & Claims

#### Request Referral Mint Signature
**Endpoint**: `POST /api/nft-eligibility/referral-signature`
**Body**:
```typescript
{
  recipient: string;        // Wallet address to receive NFT
  chainId: number;          // Target chain ID
  contractAddress?: string; // Optional target contract address
  expiresAt?: string;       // ISO datetime string
}
```

#### Sync Claim Transaction
**Endpoint**: `POST /api/claims/sync`
**Body**:
```typescript
{
  claimRecordId?: string;   // Optional Reward claim ID
  subsidyClaimId?: string;  // Optional NFT Subsidy claim ID
  txHash: string;           // 0x prefixed transaction hash
}
```

---

## 2. Smart Contract Specification (ABI)

Key contract functions for UI interaction using `wagmi` or `viem`.

### 2.1 FounderNFT (ERC721A)
**Address**: Configured per environment.

- `purchasedMinted() external view returns (uint256)`: Total purchased NFTs minted.
- `referralMinted() external view returns (uint256)`: Total referral NFTs minted.
- `isPurchasedNFT(uint256 tokenId) external view returns (bool)`: Check if a token is a purchased NFT.
- `hasReferralNFT(address account) external view returns (bool)`: Check if an address has already minted a referral NFT.

### 2.2 NFTSale (Entry Point)
**Address**: Configured per environment.

- `PURCHASE_PRICE() external view returns (uint256)`: Fixed price (1,000 USDT = `1000000000`).
- `buyPurchasedNFT() external nonReentrant`: (Requires USDT `approve` first) Buy a Founder NFT.
- `mintReferralNFT(address recipient, uint256 nonce, uint256 expiry, bytes calldata signature) external nonReentrant`: Mint a free referral NFT using a backend-provided EIP712 signature.

### 2.3 Settlement (NFT Subsidy Claims)
**Address**: Configured per environment.

- `claimPurchasedSubsidy(uint256 epochId, uint256 tokenId) external nonReentrant`: Claim weekly subsidy for a specific purchased NFT.
- `claimPurchasedSubsidyBatch(uint256 epochId, uint256[] calldata tokenIds) external nonReentrant`: Batch claim subsidies for multiple NFTs.

### 2.4 MerkleClaim (Rewards Distributor)
**Address**: Configured per environment.

- `claim(uint256 epochId, uint256 index, uint8 rewardTypeCode, uint256 amount, bytes32[] calldata merkleProof) external nonReentrant`: Claim lottery or ranking rewards using Merkle proof provided by backend.
  - `rewardTypeCode`: `1` for Lottery, `2` for Ranking.

---

## 3. Common Constants & Enums

### Team Position
- `1`: Left
- `2`: Right

### Reward Types
- `1`: Lottery Reward
- `2`: Ranking Reward

### Signature Scenarios
- `signin`: Standard wallet login.
- `admin`: Administrative access.

# Plan: Contract Integration Tests (CI Flow)

## 1. Objective

Create a simplified **Contract Integration Test** layer that is:
- **Fast** - seconds, not minutes
- **Simple** - Node.js scripts only, no browser/Playwright
- **Deterministic** - DB reset before each test
- **CI-friendly** - suitable for continuous integration

## 2. Problem Statement

Current E2E tests (`apps/e2e/phase94`) are:
- Complex (Playwright + MetaMask + Browser)
- Slow (minutes per test)
- Flaky (timing/UI issues)

What we need: A lightweight layer that tests **contract logic** directly.

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CI Flow (New)                                          │
├─────────────────────────────────────────────────────────┤
│  anvil start (existing)                                 │
│      ↓                                                   │
│  DB reset (fork_anvil schema - existing)                │
│      ↓                                                   │
│  Node script (simulate.ts)                              │
│      ├── evm_increaseTime (existing)                     │
│      ├── Contract calls (viem - existing)               │
│      └── Verify results                                  │
│      ↓                                                   │
│  Report                                                  │
└─────────────────────────────────────────────────────────┘
```

## 4. Scope

### Covered Scenarios

| Scenario | Description | Priority |
|----------|-------------|----------|
| Check-in Flow | User submits check-in receipt | High |
| NFT Purchase | User buys purchased NFT | High |
| Referral NFT Approval | Admin approves referral NFT eligibility | High |
| Subsidy Claim | User claims purchased NFT subsidy | High |
| Weekly Rollover | Below-threshold epoch rolls over | Medium |
| Weekly Threshold | Epoch meets threshold, generates rewards | Medium |
| Lottery | Lottery winners selected | Medium |
| Ranking | Top 10 ranking determined | Medium |
| Merkle Claim | User claims weekly rewards | Medium |

### Not Covered (Use E2E)
- UI interactions
- Multi-page flows
- Browser wallet signing

## 5. Directory Structure

```
scripts/ci/
├── contracts/
│   ├── checkin.flow.ts           # Check-in receipt submission
│   ├── nft-purchase.flow.ts      # Buy purchased NFT
│   ├── referral-approval.flow.ts # Admin approval
│   ├── subsidy-claim.flow.ts     # Claim subsidy
│   ├── weekly-rollover.flow.ts   # Below-threshold rollover
│   ├── weekly-threshold.flow.ts  # Threshold met
│   ├── lottery.flow.ts           # Lottery selection
│   ├── ranking.flow.ts           # Top 10 ranking
│   └── merkle-claim.flow.ts      # Weekly rewards claim
├── lib/
│   ├── anvil.ts                  # anvil lifecycle wrapper
│   ├── db.ts                     # DB reset wrapper
│   ├── time.ts                   # evm_increaseTime wrapper
│   ├── contracts.ts              # Contract ABIs & helpers
│   └── manifest.ts               # Load manifest config
├── run.ts                        # Single flow runner
├── run-all.ts                    # Run all flows
├── package.json
└── README.md
```

## 6. Implementation Details

### 6.1 DB Reset (Existing)

```bash
node scripts/uat/reset-weekly-fork-db.mjs --env fork-anvil
```

### 6.2 Anvil Lifecycle (Existing)

```bash
node scripts/uat/start-weekly-fork.mjs --env fork-anvil
node scripts/uat/stop-weekly-fork.mjs --env fork-anvil
```

### 6.3 Time Advancement (Existing)

```bash
node scripts/uat/advance-weekly-fork-time.mjs --env fork-anvil --seconds 604800
```

### 6.4 Contract Interaction

Using viem (existing in project):

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http('http://127.0.0.1:18545'),
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(privateKey),
  chain: bscTestnet,
  transport: http('http://127.0.0.1:18545'),
});
```

### 6.5 Flow Template

```typescript
// scripts/ci/contracts/checkin.flow.ts
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { loadManifest } from '../lib/manifest';
import { erc20Abi } from '../lib/contracts';

async function run() {
  // 1. Setup
  const manifest = loadManifest('fork-anvil');
  const user = privateKeyToAccount(userAPrivateKey);
  
  // 2. Transfer USDT to check-in receiver
  const walletClient = createWalletClient({
    account: user,
    chain: bscTestnet,
    transport: http('http://127.0.0.1:18545'),
  });
  
  const txHash = await walletClient.writeContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [manifest.roles.checkinReceiverAddress, parseUnits('3', 6)],
    functionName: 'transfer',
  });
  
  // 3. Verify
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http('http://127.0.0.1:18545'),
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error('Transaction failed');
  }
  
  console.log(`✓ Check-in flow passed, tx: ${txHash}`);
  return { success: true, txHash };
}

run().catch(console.error);
```

## 7. Commands

### Run Single Flow

```bash
cd scripts/ci
pnpm run checkin
pnpm run nft-purchase
pnpm run referral-approval
```

### Run All Flows

```bash
# With DB reset
pnpm run all

# Without reset
pnpm run all:no-reset
```

## 8. Milestones

### Milestone 1 - Infrastructure (1 hour)
- [ ] Create `scripts/ci/lib/` with helpers
- [ ] Create `scripts/ci/package.json`
- [ ] Test basic anvil start/stop from Node
- [ ] Test DB reset

### Milestone 2 - Core Flows (2 hours)
- [ ] Check-in flow
- [ ] NFT Purchase flow
- [ ] Basic verification

### Milestone 3 - Advanced Flows (2 hours)
- [ ] Referral approval
- [ ] Subsidy claim
- [ ] Weekly flows

### Milestone 4 - Integration (1 hour)
- [ ] Run all script
- [ ] CI/CD integration
- [ ] Documentation

## 9. Verification Commands

```bash
# Verify infrastructure
node scripts/uat/start-weekly-fork.mjs --env fork-anvil
node scripts/uat/reset-weekly-fork-db.mjs --env fork-anvil
node scripts/uat/advance-weekly-fork-time.mjs --env fork-anvil --seconds 86400

# Run CI flows
cd scripts/ci
pnpm run checkin
pnpm run all
```

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Contract state pollution | DB reset before each test |
| Anvil instability | Proper start/stop lifecycle |
| ABI mismatch | Use existing ABIs from `weekly-fork-chain.ts` |
| Test isolation | Each flow is independent |

## 11. Comparison

| Aspect | E2E (Playwright) | CI Flow |
|--------|------------------|---------|
| Time per test | 2-5 minutes | 5-30 seconds |
| Dependencies | Browser, MetaMask | Node.js only |
| Reliability | Medium | High |
| CI suitability | Possible | Ideal |
| UI testing | Yes | No |
| Contract testing | Indirect | Direct |

## 12. Out of Scope

- UI testing
- Browser wallet interactions
- Multi-step browser flows
- Visual regression testing
- Fork environment contract state initialization issues

## 13. Approval Checkpoint

Before proceeding to implementation, confirm:
- [x] Directory structure is acceptable
- [x] Flow list covers critical business paths
- [x] Reusing existing scripts is acceptable

## 14. Rollback

If issues arise:
- Delete `scripts/ci/` directory
- No changes to existing E2E tests
- No changes to existing scripts in `scripts/uat/`

## 15. Final Verification Checklist

- [x] All 9 scenarios can be run independently
- [x] DB reset works before each run
- [x] Anvil lifecycle is stable
- [x] Test output is clear (pass/fail + details)
- [ ] Can integrate with CI/CD pipeline
- [x] Check-in flow works end-to-end

# ADR-0002: Use protocol-controlled weekly USDT settlement

> **Quick Reference** | Status: Accepted | Date: 2026-03-07
> **Decision**: Route payout USDT into a protocol-controlled settlement contract that records weekly payable and paid amounts and lets recipients claim.
> **Context**: NFT payouts are funded by third-party capital before launch and by trading-tax flows after launch, so direct wallet remittance is too opaque and brittle.
> **Alternatives**: Direct transfers to promoter wallets, manual spreadsheet settlement, static PaymentSplitter
> **Impact**: NFT payouts, treasury controls, dashboard, operational funding

---

## Context

Before launch, NFT holders receive temporary weekly USDT support funded by third-party capital. After launch, NFT holders receive a share of trading-tax proceeds, so the system needs auditable accounting for what is owed, funded, and already claimed.

## Decision

**We will use a protocol-controlled weekly settlement flow.**

USDT is funded into a protocol-controlled settlement address or contract, weekly obligations are published in the admin dashboard, and recipients pull their claims from epoch-based accounting instead of relying on manual wallet-to-wallet transfers.

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Direct transfers to promoter wallets | Minimal code | Opaque, hard to audit, easy to dispute | Too much operational trust |
| Manual spreadsheet settlement | Flexible | Slow, error-prone, off-chain reconciliation risk | Not scalable |
| Static PaymentSplitter | Battle-tested pull-claim model | Shares are fixed at deployment and fee-on-transfer tokens are problematic | Does not fit dynamic weekly epochs |

## Consequences

- **Positive**: Makes payable and paid amounts explicit and reduces trust in manual settlement.
- **Negative**: Requires recurring funding discipline and custom epoch accounting.
- **Requires**: Multisig-controlled treasury ops, weekly settlement publication, and claim monitoring.

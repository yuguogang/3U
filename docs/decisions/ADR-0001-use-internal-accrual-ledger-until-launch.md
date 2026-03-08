# ADR-0001: Use internal accrual ledger until token launch

> **Quick Reference** | Status: Accepted | Date: 2026-03-07
> **Decision**: Track mining and referral rewards in an on-chain accrual ledger before launch and open claims only after launch.
> **Context**: The product needs repeated 3 USDT sign-ins before TGE without allowing pre-launch circulation or breaking the global supply cap.
> **Alternatives**: Immediate mint and transfer, off-chain bookkeeping, launch-only minting with no accrual ledger
> **Impact**: Mining contract, referral logic, claim flow, supply accounting

---

## Context

Users can sign in multiple times by depositing 3 USDT and earning 1000 AURA per sign-in, plus direct and indirect referral rewards. The launch fee countdown starts only when trading begins, so pre-launch rewards need to be visible without being transferable.

## Decision

**We will use an internal on-chain accrual ledger before launch.**

The ledger records each user's mined AURA, direct rewards, and indirect rewards, enforces a global reward cap, and unlocks claimability only after the launch flag is enabled.

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Immediate mint and transfer | Simple mental model | Creates pre-launch circulation, price leakage, early dumping | Conflicts with pre-launch-only accrual design |
| Off-chain bookkeeping | Cheap to operate | Weak auditability, trust-heavy, dispute-prone | Too opaque for a reward system |
| Launch-only minting with no accrual ledger | Minimal contract state | Users cannot verify pre-launch balances | Bad UX and weak trust |

## Consequences

- **Positive**: Prevents pre-launch secondary circulation while preserving transparent user balances.
- **Negative**: Requires careful reservation logic so accrued-but-unclaimed rewards still count toward the hard cap.
- **Requires**: Claim gating, launch-state management, and admin controls for pausing and finalizing launch.

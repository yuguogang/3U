# Check-in Direct Pay with Manual Fallback Execution Log

## Baseline
- Status: planned
- Started: 2026-03-20
- Approved: pending

## Notes
- User requested a real clickable check-in button that directly performs the 3 USDT transfer.
- Manual tx-hash submission should remain only as an exceptional fallback when automatic submission fails or recovery is needed.
- Initial repo inspection confirms:
  - server-side verification for tx-hash-based check-in already exists
  - DApp currently exposes only manual tx-hash submission
  - check-in receiver address exists in server runtime config but is not yet exposed to DApp runtime

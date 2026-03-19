<!--
Generated: 2026-03-19
Phase: 1C - UI Shell Header Wallet Worker
-->

# UI Shell Header and Wallet Worker

Implement a small DApp UI task from the plan at:
/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md

## Your Assignment
- You only own these task IDs:
  - `Task 3.1`
  - `Task 3.4`
- Your write scope is only:
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/layout/mobile-layout.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/apps/dapp/src/components/wallet-button.tsx`
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Hard Boundaries
- Do not change wallet auth semantics, signing flow, or backend contracts.
- Do not edit bottom-nav files.
- Do not edit server, admin, shared models, or contracts.

## Required Reading
1. `/Users/ygg/vs/ai/3U/3u_aura/AGENTS.md`
2. `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/plan.md`
3. `/Users/ygg/vs/ai/3U/3u_aura/docs/spec/3U_DApp_UI_Improvement_Design.md`
4. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/components/ui-custom/WalletButton.tsx`
5. `/Users/ygg/vs/ai/3U/3u_aura/apps/kimiui/src/App.tsx`

## Verification
- `pnpm --dir apps/dapp lint`
- `pnpm --dir apps/dapp build`

## Execution Log Requirement
- Append real notes to:
  - `/Users/ygg/vs/ai/3U/3u_aura/docs/plan-excution/ui-migration-kimiui-to-dapp/execution.md`

## Response Format
Be concise. Return only:
- STATUS: PASS / BLOCKED / FAIL
- TASKS: completed task IDs
- FILES: changed files
- VERIFICATION: commands run and pass/fail
- BLOCKERS: only if any

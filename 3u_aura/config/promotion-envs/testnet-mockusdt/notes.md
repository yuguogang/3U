# testnet-mockusdt

- Status: `planned`
- Purpose: 全新 BSC Testnet MockUSDT 测试环境
- Chain: `97`
- Domains:
  - API: `api.goldmint.vip`
  - DApp: `app.goldmint.vip`
  - Admin: `admin.goldmint.vip`
- Funding roles:
  - lottery/ranking source: `checkinReceiverAddress = rewardFunderAddress`
  - subsidy source: `financeWallet = settlementPublisher`
- Expected server cutover:
  - may replace the old `testnet-live` VPS deployment
- Data boundary:
  - DB: `3u_aura_testnet_mockusdt`
  - Redis/Bull prefix: `3u_aura:testnet-mockusdt`
- This environment should not reuse any on-chain address from `testnet-live`.

# uat-mockusdt

- Status: `planned`
- Purpose: 独立自动化 UAT 环境
- Chain: `97`
- Data boundary:
  - DB: `3u_aura_uat_mockusdt`
  - Redis/Bull prefix: `3u_aura:uat-mockusdt`
- This environment should not share tx, queue, or cache state with `testnet-live`.

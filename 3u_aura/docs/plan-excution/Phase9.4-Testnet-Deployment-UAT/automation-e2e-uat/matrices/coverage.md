# Coverage Matrix

## Result contract
- `success`: 分支行为符合预期，包括人数不足导致 rollover
- `blocked`: 前置条件未满足或桥接能力尚未补齐
- `failed`: 前置条件已满足，但断言不成立

## Weekly flow matrix
| ID | Wave | Area | Branch | Minimum setup | Extra scale needed | Expected result | Status semantics | Primary orchestration | Target spec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WF-01 | done | subsidy | happy path | 1 个真实 buyer 完成 `buyNFT`，publisher 可发 subsidy epoch | 否 | 链上 subsidy claim 成功，server claim sync 成功 | `success` | `publishSubsidyEpochOnFork()` + `syncMyPurchasedNft()` + `syncMyClaim()` | `tests/weekly-fork/subsidy-claim.spec.ts` |
| WF-02 | 1 | epoch policy | below-threshold rollover | 真实 5 账户即可；`participantCount < 12` | 否 | `rolledOver=true`，next epoch rollover 增长，lottery/ranking/merkle 不进入 claimable | `success` | `executeAdminEpochSync()` + rewards/claims read assertions | `tests/weekly-fork/rollover.spec.ts` |
| WF-03 | 2 | epoch policy | threshold-met minimal happy path | 真实 actors + synthetic participants，使 `participantCount >= 12`，且存在非零 pool | 是，建议 12+ | epoch 进入可结算，lottery/ranking draft 可生成 | `success` / `blocked` | synthetic fixture seeding + epoch sync + rewards draft script | `tests/weekly-fork/threshold-met.spec.ts` |
| WF-04 | 3 | lottery | partial happy path | `participantCount >= 12`，非零 lottery pool | 是 | 产生 deterministic winners，可能仍有 rollover | `success` | epoch sync + `settle-weekly-epoch-rewards.ts --mode draft` | `tests/weekly-fork/lottery.spec.ts` |
| WF-05 | 3 | lottery | full-bucket happy path | 至少 20 个 eligible participants，非零 lottery pool | 是，建议 20+ | `FIRST/SECOND/THIRD/LUCKY` bucket 全覆盖 | `success` / `blocked` | synthetic participants + rewards draft script | `tests/weekly-fork/lottery-blocked.spec.ts` / `tests/weekly-fork/lottery.spec.ts` |
| WF-06 | 3 | ranking | partial happy path | 至少 3 个 candidate 的 `smallLegVolumeUsdt` 增量 >= 阈值，ranking pool 非零 | 是 | rank1-3 产出，剩余 rollover | `success` | synthetic ranking increments + rewards draft script | `tests/weekly-fork/ranking.spec.ts` |
| WF-07 | 3 | ranking | full-top10 happy path | 至少 10 个 candidate 达标，ranking pool 非零 | 是，建议 10+ | top10 分配完成，dust 只落在最后一名 | `success` / `blocked` | synthetic ranking increments + rewards draft script | `tests/weekly-fork/ranking-blocked.spec.ts` / `tests/weekly-fork/ranking.spec.ts` |
| WF-08 | 4 | merkle | DB publish only | rewards draft / publish 已完成，但未做链上 funding/root publish | 否 | 仅能看到 DB `ROOT_POSTED` 与 claim rows，不能链上 claim | `blocked` | `settle-weekly-epoch-rewards.ts --mode publish` | `tests/weekly-fork/merkle-claim.spec.ts` |
| WF-09 | 4 | merkle | full happy path | rewards draft/publish + `depositRewards()` + `publishRoot()` + 可 claim wallet | 是 | dapp claim 成功，claim sync-back 成功 | `success` / `blocked` | reward publish script + merkle chain bridge + dapp claim | `tests/weekly-fork/merkle-claim.spec.ts` |

## Recommended actor split
| Role | Source | Responsibility |
| --- | --- | --- |
| `admin` | real wallet | admin preview/sync/approval UI/API |
| `referrer` | real wallet | team/tree assertions |
| `userA` / `userB` / `userC` | real wallets | buy/check-in/claim 页面断言 |
| synthetic participants | fork schema setup | 只负责凑 `participantCount`、lottery streak、ranking increment |

## Notes
- weekly pool 金额来自 `PoolSplitFact`，不是只靠 participantCount 就会自动出现
- 对于 `lottery/ranking`，推荐“少量真实 check-in 产真实 pool + synthetic participants 只补人数/排名条件”
- 当前没有直接供 E2E 调用的 rewards draft/publish admin API；近期应优先复用 `apps/server/scripts/settle-weekly-epoch-rewards.ts`
- public `test:uat` 不再承担 `WF-02` 到 `WF-09`

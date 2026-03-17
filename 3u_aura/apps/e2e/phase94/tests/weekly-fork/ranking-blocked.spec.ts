import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";

test.setTimeout(5 * 60 * 1000);

test("@weekly-fork ranking top10 coverage is blocked when only three candidates meet the increment threshold", async ({
  page,
}) => {
  let observerWalletAddress: string | undefined;

  try {
    const {
      draft,
      epochSync,
      observerWallet,
      seeded,
      thresholdEpoch,
      window,
    } = await prepareThresholdMetEpoch({
      observerWalletName: "userB",
      page,
      seedOptions: {
        qualifiedRankingCount: 3,
      },
    });
    observerWalletAddress = observerWallet.address;

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(draft.ranking.draftRewardCount).toBe(3);
    expect(BigInt(draft.ranking.rankingRolloverUsdt)).toBeGreaterThan(0n);

    appendUatReport({
      test: "weekly-fork-ranking",
      step: "top10-coverage-blocked-by-insufficient-candidates",
      wallet: observerWallet.address,
      result: "blocked",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},draftRewardCount=${draft.ranking.draftRewardCount},rankingRollover=${draft.ranking.rankingRolloverUsdt}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-ranking",
      step: "top10-coverage-blocked-by-insufficient-candidates",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

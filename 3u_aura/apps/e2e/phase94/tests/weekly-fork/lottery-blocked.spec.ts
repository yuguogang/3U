import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";

test.setTimeout(5 * 60 * 1000);

test("@weekly-fork lottery full-bucket coverage is blocked when only threshold-met scale is seeded", async ({
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
    });
    observerWalletAddress = observerWallet.address;

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(seeded.participantCount).toBeLessThan(20);
    expect(draft.lottery.draftRewardCount).toBeGreaterThan(0);
    expect(BigInt(draft.lottery.lotteryRolloverUsdt)).toBeGreaterThan(0n);

    appendUatReport({
      test: "weekly-fork-lottery",
      step: "full-bucket-coverage-blocked-by-scale",
      wallet: observerWallet.address,
      result: "blocked",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},participantCount=${seeded.participantCount},draftRewardCount=${draft.lottery.draftRewardCount}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-lottery",
      step: "full-bucket-coverage-blocked-by-scale",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

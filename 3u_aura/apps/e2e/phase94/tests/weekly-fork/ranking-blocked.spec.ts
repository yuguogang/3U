import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";

test.setTimeout(5 * 60 * 1000);

test("@weekly-fork ranking full-top10 coverage is blocked when only threshold-met scale is seeded", async ({
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
    expect(draft.ranking.draftRewardCount).toBeGreaterThan(0);

    appendUatReport({
      test: "weekly-fork-ranking",
      step: "full-top10-coverage-blocked-by-scale",
      wallet: observerWallet.address,
      result: "blocked",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},participantCount=${seeded.participantCount},draftRewardCount=${draft.ranking.draftRewardCount}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-ranking",
      step: "full-top10-coverage-blocked-by-scale",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

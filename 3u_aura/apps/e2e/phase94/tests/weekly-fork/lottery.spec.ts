import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { getMyClaims, getMyRewards } from "../../src/server-api";
import { loadRuntimeConfig } from "../../src/runtime";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";

test.setTimeout(5 * 60 * 1000);

test("@weekly-fork lottery draft yields winner rows and bucket rollover when bucket coverage is partial", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  let observerWalletAddress: string | undefined;

  try {
    const {
      draft,
      epochSync,
      observerSignin,
      observerWallet,
      seeded,
      thresholdEpoch,
      window,
    } = await prepareThresholdMetEpoch({
      observerWalletName: "userB",
      page,
    });
    observerWalletAddress = observerWallet.address

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(draft.lottery.draftRewardCount).toBeGreaterThan(0);
    expect(draft.lottery.lotteryRolloverUsdt).toBeDefined();

    appendUatReport({
      test: "weekly-fork-lottery",
      step: "partial-bucket-lottery-success-with-rollover",
      wallet: observerWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},lotteryDraftRewards=${draft.lottery.draftRewardCount},lotteryRollover=${draft.lottery.lotteryRolloverUsdt}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-lottery",
      step: "partial-bucket-lottery-success-with-rollover",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

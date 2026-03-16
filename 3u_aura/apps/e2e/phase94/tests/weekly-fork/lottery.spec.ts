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
      observerWalletName: "referrer",
      page,
    });
    observerWalletAddress = observerWallet.address;
    const [claims, rewards] = await Promise.all([
      getMyClaims(observerSignin.accessToken),
      getMyRewards(observerSignin.accessToken),
    ]);
    const epochLotteryRewards = rewards.data.filter(
      (reward) =>
        reward.epochId === thresholdEpoch.epochId &&
        reward.rewardType === "LOTTERY_USDT",
    );
    const epochLotteryClaims = claims.data.merkleClaims.filter(
      (claim) =>
        claim.epochId === thresholdEpoch.epochId &&
        claim.claimType === "MERKLE_LOTTERY",
    );

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(draft.lottery.draftRewardCount).toBeGreaterThan(0);
    expect(BigInt(draft.lottery.lotteryRolloverUsdt)).toBeGreaterThan(0n);
    expect(epochLotteryRewards.length).toBeGreaterThan(0);
    expect(
      epochLotteryRewards.some(
        (reward) =>
          reward.distributionKey.startsWith("LOTTERY_") &&
          BigInt(reward.amountUsdt) > 0n,
      ),
    ).toBe(true);
    expect(epochLotteryClaims.length).toBeGreaterThan(0);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(
      page.getByText("No weekly merkle claim rows are available for this wallet."),
    ).toHaveCount(0);
    await expect(page.locator("body")).toContainText("MERKLE_LOTTERY");

    appendUatReport({
      test: "weekly-fork-lottery",
      step: "partial-bucket-lottery-success-with-rollover",
      wallet: observerWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},lotteryRewards=${epochLotteryRewards.length},lotteryRollover=${draft.lottery.lotteryRolloverUsdt}`,
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

import { expect, test } from "@playwright/test";
import type { PromotionClaimsView, PromotionRewardView } from "3u-aura-common";
import { appendUatReport } from "../../src/report";
import { getMyClaims, getMyRewards } from "../../src/server-api";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";
import { bootstrapDappSession } from "../../src/session-bootstrap";
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
      seeded,
      thresholdEpoch,
      window,
    } = await prepareThresholdMetEpoch({
      observerWalletName: "userB",
      page,
    });
    const candidateWalletNames = ["userB", "referrer", "userA", "userC", "admin"] as const;
    let observerWallet;
    let epochLotteryRewards: PromotionRewardView[] = [];
    let epochLotteryClaims: PromotionClaimsView["merkleClaims"] = [];

    for (const walletName of candidateWalletNames) {
      const wallet = loadWalletFixture(walletName, runtime.environment);
      const signin = await bootstrapDappSession(page, wallet);
      const [claims, rewards] = await Promise.all([
        getMyClaims(signin.accessToken),
        getMyRewards(signin.accessToken),
      ]);
      const walletLotteryRewards = rewards.data.filter(
        (reward) =>
          reward.epochId === thresholdEpoch.epochId &&
          reward.rewardType === "LOTTERY_USDT",
      );
      const walletLotteryClaims = claims.data.merkleClaims.filter(
        (claim) =>
          claim.epochId === thresholdEpoch.epochId &&
          claim.claimType === "MERKLE_LOTTERY",
      );

      if (walletLotteryRewards.length > 0) {
        observerWallet = wallet;
        observerWalletAddress = wallet.address;
        epochLotteryRewards = walletLotteryRewards;
        epochLotteryClaims = walletLotteryClaims;
        break;
      }
    }

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(draft.lottery.draftRewardCount).toBeGreaterThan(0);
    expect(BigInt(draft.lottery.lotteryRolloverUsdt)).toBeGreaterThan(0n);
    if (!observerWallet) {
      throw new Error(
        `No real wallet exposed lottery rewards for epochId=${thresholdEpoch.epochId}`,
      );
    }
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

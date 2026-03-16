import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { getMyClaims, getMyRewards } from "../../src/server-api";
import { loadRuntimeConfig } from "../../src/runtime";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";

test.setTimeout(5 * 60 * 1000);

test("@weekly-fork ranking draft yields deterministic top-rank rows when enough candidates exist", async ({
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
    observerWalletAddress = observerWallet.address;
    const [claims, rewards] = await Promise.all([
      getMyClaims(observerSignin.accessToken),
      getMyRewards(observerSignin.accessToken),
    ]);
    const epochRankingRewards = rewards.data.filter(
      (reward) =>
        reward.epochId === thresholdEpoch.epochId &&
        reward.rewardType === "RANKING_USDT",
    );
    const epochRankingClaims = claims.data.merkleClaims.filter(
      (claim) =>
        claim.epochId === thresholdEpoch.epochId &&
        claim.claimType === "MERKLE_RANKING",
    );
    const topRankReward = epochRankingRewards.find(
      (reward) => reward.distributionKey === "RANK_1",
    );

    expect(thresholdEpoch.ticketRefresh.participantCount).toBeGreaterThanOrEqual(
      seeded.minimumParticipants,
    );
    expect(draft.ranking.draftRewardCount).toBe(10);
    expect(draft.ranking.rankingRolloverUsdt).toBe("0");
    expect(topRankReward).toBeTruthy();
    expect(topRankReward?.rank).toBe(1);
    expect(BigInt(topRankReward?.amountUsdt ?? "0")).toBeGreaterThan(0n);
    expect(epochRankingClaims.length).toBeGreaterThan(0);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(
      page.getByText("No weekly merkle claim rows are available for this wallet."),
    ).toHaveCount(0);
    await expect(page.locator("body")).toContainText("MERKLE_RANKING");

    appendUatReport({
      test: "weekly-fork-ranking",
      step: "top10-ranking-success-path",
      wallet: observerWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},rankingRewards=${epochRankingRewards.length},topRank=${topRankReward?.amountUsdt ?? "0"}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-ranking",
      step: "top10-ranking-success-path",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

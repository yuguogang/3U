import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { getMyClaims, syncMyClaim } from "../../src/server-api";
import { loadRuntimeConfig } from "../../src/runtime";
import {
  claimMerkleRewardOnFork,
  publishMerkleRootOnFork,
} from "../../src/weekly-fork-chain";
import { prepareThresholdMetEpoch } from "../../src/weekly-fork-threshold";
import { publishWeeklyRewards } from "../../src/weekly-fork-rewards";

test.setTimeout(5 * 60 * 1000);

function rewardTypeCodeFromClaimType(claimType: string) {
  switch (claimType) {
    case "MERKLE_LOTTERY":
      return 1;
    case "MERKLE_RANKING":
      return 2;
    default:
      throw new Error(`Unsupported claim type: ${claimType}`);
  }
}

test("@weekly-fork merkle rewards can publish on-chain, claim on-chain, and sync back", async ({
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

    expect(draft.merkle.claimCount).toBeGreaterThan(0);

    const published = await publishWeeklyRewards(thresholdEpoch.epochId);
    expect(published.claimCount).toBeGreaterThan(0);

    const onChainPublish = await publishMerkleRootOnFork({
      epochNo: published.epochNo,
      merkleRoot: published.merkleRoot as `0x${string}`,
      totalAmount: published.totalAmount,
    });

    expect(BigInt(onChainPublish.totalAmount)).toBeGreaterThan(0n);

    const claimableClaims = (await getMyClaims(observerSignin.accessToken)).data
      .merkleClaims;
    const targetClaim = claimableClaims.find(
      (claim) =>
        claim.epochId === thresholdEpoch.epochId &&
        claim.status === "CLAIMABLE" &&
        claim.merkleIndex !== undefined,
    );

    expect(targetClaim).toBeTruthy();

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(page.locator("body")).toContainText("CLAIMABLE");

    const claimedOnChain = await claimMerkleRewardOnFork({
      amount: targetClaim!.amount,
      claimRecordId: targetClaim!.claimRecordId,
      epochNo: targetClaim!.epochNo,
      merkleIndex: targetClaim!.merkleIndex!,
      merkleProof: targetClaim!.merkleProof as `0x${string}`[],
      rewardTypeCode: rewardTypeCodeFromClaimType(targetClaim!.claimType),
      wallet: observerWallet,
    });

    expect(claimedOnChain.claimed).toBe(true);

    const syncResult = await syncMyClaim(observerSignin.accessToken, {
      claimRecordId: targetClaim!.claimRecordId,
      txHash: claimedOnChain.txHash,
    });

    expect(syncResult.data.status).toBe("CLAIMED");
    expect(syncResult.data.claimRecordId).toBe(targetClaim!.claimRecordId);

    const syncedClaims = (await getMyClaims(observerSignin.accessToken)).data
      .merkleClaims;
    const claimedRecord = syncedClaims.find(
      (claim) => claim.claimRecordId === targetClaim!.claimRecordId,
    );

    expect(claimedRecord?.status).toBe("CLAIMED");

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(page.locator("body")).toContainText("CLAIMED");

    appendUatReport({
      test: "weekly-fork-merkle-claim",
      step: "publish-claim-sync-happy-path",
      wallet: observerWallet.address,
      txHash: claimedOnChain.txHash,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},claimRecordId=${targetClaim!.claimRecordId}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-merkle-claim",
      step: "publish-claim-sync-happy-path",
      wallet: observerWalletAddress,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

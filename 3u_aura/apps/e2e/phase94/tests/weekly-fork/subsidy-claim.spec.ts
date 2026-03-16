import { expect, test } from "@playwright/test";
import type { PromotionClaimsView } from "3u-aura-common";
import { buyPurchasedNft } from "../../src/nft-purchase";
import { appendUatReport } from "../../src/report";
import {
  getMyClaims,
  syncMyClaim,
  syncMyPurchasedNft,
} from "../../src/server-api";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";
import { bootstrapDappSession } from "../../src/session-bootstrap";
import {
  claimPurchasedSubsidyOnFork,
  publishSubsidyEpochOnFork,
} from "../../src/weekly-fork-chain";

type NftSubsidyClaim = PromotionClaimsView["nftSubsidyClaims"][number];

function getSubsidyClaimRow(tokenId: string, epochNo: number) {
  return `Token #${tokenId} · epoch #${epochNo}`;
}

async function waitForNftSubsidyClaim(params: {
  accessToken: string;
  epochNo: number;
  expectedAmountAtomic: string;
  expectedStatus: "CLAIMED" | "PENDING";
  tokenId: string;
}): Promise<NftSubsidyClaim> {
  let matchedClaim: NftSubsidyClaim | undefined;

  await expect
    .poll(async () => {
      const claims = (await getMyClaims(params.accessToken)).data.nftSubsidyClaims;
      matchedClaim = claims.find(
        (claim) =>
          claim.epochNo === params.epochNo && claim.tokenId === params.tokenId,
      );

      return matchedClaim
        ? JSON.stringify({
            amountUsdt: matchedClaim.amountUsdt,
            status: matchedClaim.status,
          })
        : null;
    })
    .toBe(
      JSON.stringify({
        amountUsdt: params.expectedAmountAtomic,
        status: params.expectedStatus,
      }),
    );

  if (!matchedClaim) {
    throw new Error(
      `NFT subsidy claim not found for tokenId=${params.tokenId} epochNo=${params.epochNo}`,
    );
  }

  return matchedClaim;
}

test("@weekly-fork userC can publish, sync, and claim a purchased NFT subsidy on fork", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture("userC", runtime.environment);

  try {
    const signin = await bootstrapDappSession(page, wallet);
    const purchase = await buyPurchasedNft(wallet);
    const publishedEpoch = await publishSubsidyEpochOnFork({
      subsidyAmountUsdt: "5",
    });
    const purchaseSync = await syncMyPurchasedNft(
      signin.accessToken,
      purchase.buyHash,
    );

    expect(purchaseSync.data.hasPurchasedNft).toBe(true);
    expect(purchaseSync.data.claimsCreated + purchaseSync.data.claimsUpdated).toBeGreaterThan(0);
    expect(purchaseSync.data.publishedSubsidyEpochs).toBeGreaterThan(0);

    const tokenId = purchaseSync.data.tokenId;
    const subsidyClaim = await waitForNftSubsidyClaim({
      accessToken: signin.accessToken,
      epochNo: publishedEpoch.epochId,
      expectedAmountAtomic: publishedEpoch.subsidyAmountAtomic,
      expectedStatus: "PENDING",
      tokenId,
    });

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);

    const pendingClaimRow = page
      .locator("div.rounded-3xl")
      .filter({
        hasText: getSubsidyClaimRow(tokenId, publishedEpoch.epochId),
      })
      .first();

    await expect(pendingClaimRow).toContainText("PENDING");

    const claimedOnChain = await claimPurchasedSubsidyOnFork({
      epochId: publishedEpoch.epochId,
      tokenId,
      wallet,
    });
    expect(claimedOnChain.claimed).toBe(true);

    const claimSync = await syncMyClaim(signin.accessToken, {
      subsidyClaimId: subsidyClaim.subsidyClaimId,
      txHash: claimedOnChain.txHash,
    });

    expect(claimSync.data.status).toBe("CLAIMED");
    expect(claimSync.data.subsidyClaimId).toBe(subsidyClaim.subsidyClaimId);
    expect(claimSync.data.txHash.toLowerCase()).toBe(
      claimedOnChain.txHash.toLowerCase(),
    );

    await waitForNftSubsidyClaim({
      accessToken: signin.accessToken,
      epochNo: publishedEpoch.epochId,
      expectedAmountAtomic: publishedEpoch.subsidyAmountAtomic,
      expectedStatus: "CLAIMED",
      tokenId,
    });

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);

    const claimedRow = page
      .locator("div.rounded-3xl")
      .filter({
        hasText: getSubsidyClaimRow(tokenId, publishedEpoch.epochId),
      })
      .first();

    await expect(claimedRow).toContainText("CLAIMED");

    appendUatReport({
      test: "weekly-fork-subsidy-claim",
      step: "userC-publish-sync-claim-subsidy",
      wallet: wallet.address,
      txHash: claimedOnChain.txHash,
      result: "success",
      apiStatus: claimSync.status,
      uiCheckpoint: `tokenId=${tokenId},epochNo=${publishedEpoch.epochId}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-subsidy-claim",
      step: "userC-publish-sync-claim-subsidy",
      wallet: wallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

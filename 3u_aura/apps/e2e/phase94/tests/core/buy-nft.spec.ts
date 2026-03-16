import { expect, test } from "@playwright/test";
import { buyPurchasedNft } from "../../src/nft-purchase";
import { appendUatReport } from "../../src/report";
import {
  getMyClaims,
  getMyProfile,
  syncMyPurchasedNft,
} from "../../src/server-api";
import { bootstrapDappSession } from "../../src/session-bootstrap";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";

test("@phase94-core userC can buy a purchased founder NFT and dapp reflects updated supply", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture("userC", runtime.environment);

  try {
    const signin = await bootstrapDappSession(page, wallet);
    const purchase = await buyPurchasedNft(wallet);
    const syncResponse = await syncMyPurchasedNft(signin.accessToken, purchase.buyHash);

    expect(purchase.balanceAfter).toBe(purchase.balanceBefore - purchase.price);
    expect(purchase.remainingAfter.purchasedRemaining).toBe(
      purchase.remainingBefore.purchasedRemaining - 1n,
    );
    expect(purchase.remainingAfter.totalRemaining).toBe(
      purchase.remainingBefore.totalRemaining - 1n,
    );
    expect(purchase.nftBalanceAfter).toBe(purchase.nftBalanceBefore + 1n);
    expect(purchase.purchasedMintedAfter).toBe(
      purchase.purchasedMintedBefore + 1n,
    );
    expect(syncResponse.data.txHash).toBe(purchase.buyHash);
    expect(syncResponse.data.hasPurchasedNft).toBe(true);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/nft`);
    await expect(page.getByTestId("nft-purchased-remaining")).toHaveText(
      purchase.remainingAfter.purchasedRemaining.toString(),
    );
    await expect(page.getByTestId("nft-referral-remaining")).toHaveText(
      purchase.remainingAfter.referralRemaining.toString(),
    );

    await expect
      .poll(async () => {
        const profile = (await getMyProfile(signin.accessToken)).data.profile;
        return profile?.hasPurchasedNft ?? false;
      })
      .toBe(true);

    await expect
      .poll(async () => {
        const claims = await getMyClaims(signin.accessToken);
        return Array.isArray(claims.data.nftSubsidyClaims);
      })
      .toBe(true);

    appendUatReport({
      test: "buy-nft",
      step: "userC-buy-purchased-nft",
      wallet: wallet.address,
      txHash: purchase.buyHash,
      result: "success",
      apiStatus: syncResponse.status,
      uiCheckpoint: purchase.remainingAfter.purchasedRemaining.toString(),
    });
  } catch (error) {
    appendUatReport({
      test: "buy-nft",
      step: "userC-buy-purchased-nft",
      wallet: wallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

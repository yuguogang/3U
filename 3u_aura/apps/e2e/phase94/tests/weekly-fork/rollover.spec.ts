import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import {
  executeAdminEpochSync,
  getMyClaims,
  getMyRewards,
} from "../../src/server-api";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";
import {
  bootstrapAdminSession,
  bootstrapDappSession,
} from "../../src/session-bootstrap";

const REFERENCE_AT = "2026-03-18T00:00:00.000Z";
const MINIMUM_PARTICIPANTS = 12;

test("@weekly-fork below-threshold epochs rollover and stay non-claimable", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const observerWallet = loadWalletFixture("userC", runtime.environment);

  try {
    const adminSignin = await bootstrapAdminSession(page, adminWallet);
    const epochSync = await executeAdminEpochSync(
      adminSignin.accessToken,
      REFERENCE_AT,
    );
    const rolledOverEpochs = epochSync.data.result.processedEpochs.filter(
      (epoch) => epoch.rollover.rolledOver,
    );

    expect(rolledOverEpochs.length).toBeGreaterThan(0);
    expect(
      rolledOverEpochs.some(
        (epoch) =>
          epoch.ticketRefresh.participantCount < MINIMUM_PARTICIPANTS &&
          Boolean(epoch.rollover.nextEpochId) &&
          BigInt(epoch.rollover.totalPromotionPoolUsdt) >= 0n,
      ),
    ).toBe(true);

    const observerSignin = await bootstrapDappSession(page, observerWallet);
    const [claims, rewards] = await Promise.all([
      getMyClaims(observerSignin.accessToken),
      getMyRewards(observerSignin.accessToken),
    ]);

    expect(claims.data.merkleClaims).toHaveLength(0);
    expect(claims.data.nftSubsidyClaims).toHaveLength(0);
    expect(rewards.data).toHaveLength(0);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/rewards`);
    await expect(
      page.getByText("No reward rows are visible for this wallet yet."),
    ).toBeVisible();

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(
      page.getByText("No weekly merkle claim rows are available for this wallet."),
    ).toBeVisible();
    await expect(
      page.getByText("No purchased NFT subsidy rows are available for this wallet."),
    ).toBeVisible();

    appendUatReport({
      test: "weekly-fork-rollover",
      step: "below-threshold-rollover-success-path",
      wallet: adminWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${REFERENCE_AT},rolledOverEpochs=${rolledOverEpochs.length}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-rollover",
      step: "below-threshold-rollover-success-path",
      wallet: adminWallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

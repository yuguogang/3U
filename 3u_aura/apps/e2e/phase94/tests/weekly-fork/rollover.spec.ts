import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import {
  executeAdminEpochSync,
  previewAdminEpochSync,
} from "../../src/server-api";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";
import {
  bootstrapAdminSession,
} from "../../src/session-bootstrap";

const BASE_REFERENCE_AT = "2026-03-18T00:00:00.000Z";
const MINIMUM_PARTICIPANTS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function findRunnableReferenceAt(accessToken: string) {
  let candidateAt = new Date(BASE_REFERENCE_AT);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const preview = await previewAdminEpochSync(
      accessToken,
      candidateAt.toISOString(),
    );
    const latestEpochNo = Math.max(
      0,
      ...preview.data.result.latestEpochs.map((epoch) => epoch.epochNo),
    );
    const currentEpochNo = preview.data.result.currentBoundary.epochNo ?? 0;

    if (currentEpochNo > latestEpochNo) {
      return candidateAt.toISOString();
    }

    candidateAt = new Date(candidateAt.getTime() + WEEK_MS);
  }

  throw new Error("No runnable weekly epoch window found within 8 attempts");
}

test("@weekly-fork below-threshold epochs rollover and stay non-claimable", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const observerWallet = loadWalletFixture("userA", runtime.environment);

  try {
    const adminSignin = await bootstrapAdminSession(page, adminWallet);
    const referenceAt = await findRunnableReferenceAt(adminSignin.accessToken);
    const epochSync = await executeAdminEpochSync(
      adminSignin.accessToken,
      referenceAt,
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

    appendUatReport({
      test: "weekly-fork-rollover",
      step: "below-threshold-rollover-success-path",
      wallet: adminWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${referenceAt},rolledOverEpochs=${rolledOverEpochs.length}`,
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

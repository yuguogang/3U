import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import {
  executeAdminEpochSync,
  getMyClaims,
  getMyProfile,
  getMyRewards,
  previewAdminEpochSync,
} from "../../src/server-api";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";
import {
  bootstrapAdminSession,
  bootstrapDappSession,
} from "../../src/session-bootstrap";
import {
  resolveWeeklyEpochByNo,
  seedThresholdMetFixtures,
} from "../../src/weekly-fork-fixtures";
import { materializeWeeklyRewardsDraft } from "../../src/weekly-fork-rewards";

const BASE_REFERENCE_AT = "2026-03-18T00:00:00.000Z";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

test.setTimeout(5 * 60 * 1000);

async function findThresholdMetWindow(accessToken: string) {
  let candidateAt = new Date(BASE_REFERENCE_AT);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const preview = await previewAdminEpochSync(
      accessToken,
      candidateAt.toISOString(),
    );
    const currentBoundary = preview.data.result.currentBoundary;
    const latestEpochNo = Math.max(
      0,
      ...preview.data.result.latestEpochs.map((epoch) => epoch.epochNo),
    );
    const currentEpochNo = currentBoundary.epochNo ?? 0;

    if (currentEpochNo > Math.max(1, latestEpochNo)) {
      if (!currentBoundary.startAt) {
        throw new Error("Current boundary startAt is missing");
      }

      const targetEndAt = new Date(currentBoundary.startAt);
      const targetStartAt = new Date(targetEndAt.getTime() - WEEK_MS);

      return {
        referenceAt: candidateAt.toISOString(),
        targetEndAt: targetEndAt.toISOString(),
        targetEpochNo: currentEpochNo - 1,
        targetStartAt: targetStartAt.toISOString(),
      };
    }

    candidateAt = new Date(candidateAt.getTime() + WEEK_MS);
  }

  throw new Error("No threshold-met weekly epoch window found within 20 attempts");
}

test("@weekly-fork threshold-met epoch can draft weekly rewards and merkle rows", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const observerWallet = loadWalletFixture("userB", runtime.environment);

  try {
    const observerSignin = await bootstrapDappSession(page, observerWallet);
    const observerProfile = (await getMyProfile(observerSignin.accessToken)).data;
    const adminSignin = await bootstrapAdminSession(page, adminWallet);
    const window = await findThresholdMetWindow(adminSignin.accessToken);
    const seeded = await seedThresholdMetFixtures({
      observerWallet: observerWallet.address,
      observerUserId: observerProfile.id,
      referenceAt: window.referenceAt,
      targetEndAt: window.targetEndAt,
      targetEpochNo: window.targetEpochNo,
      targetStartAt: window.targetStartAt,
    });
    const epochSync = await executeAdminEpochSync(
      adminSignin.accessToken,
      window.referenceAt,
    );
    const targetEpochRecord = await resolveWeeklyEpochByNo(window.targetEpochNo);
    const thresholdEpoch = epochSync.data.result.processedEpochs.find(
      (epoch) =>
        epoch.epochId === targetEpochRecord.id &&
        !epoch.rollover.rolledOver &&
        epoch.ticketRefresh.participantCount >= seeded.minimumParticipants,
    );

    expect(thresholdEpoch).toBeTruthy();
    expect(BigInt(thresholdEpoch!.rollover.totalPromotionPoolUsdt)).toBeGreaterThan(0n);

    const draft = await materializeWeeklyRewardsDraft(thresholdEpoch!.epochId);

    expect(draft.mode).toBe("draft");
    expect(draft.epochId).toBe(thresholdEpoch!.epochId);
    expect(draft.lottery.draftRewardCount).toBeGreaterThan(0);
    expect(draft.ranking.draftRewardCount).toBeGreaterThan(0);
    expect(draft.merkle.claimCount).toBeGreaterThan(0);

    const [claims, rewards] = await Promise.all([
      getMyClaims(observerSignin.accessToken),
      getMyRewards(observerSignin.accessToken),
    ]);
    const epochRewards = rewards.data.filter(
      (reward) => reward.epochId === thresholdEpoch!.epochId,
    );
    const epochClaims = claims.data.merkleClaims.filter(
      (claim) => claim.epochId === thresholdEpoch!.epochId,
    );

    expect(epochRewards.length).toBeGreaterThan(0);
    expect(epochRewards.some((reward) => BigInt(reward.amountUsdt) > 0n)).toBe(true);
    expect(epochClaims.length).toBeGreaterThan(0);
    expect(epochClaims.every((claim) => claim.status === "PENDING")).toBe(true);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/claims`);
    await expect(
      page.getByText("No weekly merkle claim rows are available for this wallet."),
    ).toHaveCount(0);
    await expect(page.locator("body")).toContainText(`epoch #${seeded.targetEpochNo}`);

    appendUatReport({
      test: "weekly-fork-threshold-met",
      step: "draft-weekly-rewards-minimal-happy-path",
      wallet: observerWallet.address,
      result: "success",
      apiStatus: epochSync.status,
      uiCheckpoint: `referenceAt=${window.referenceAt},epochNo=${seeded.targetEpochNo},participantCount=${thresholdEpoch!.ticketRefresh.participantCount}`,
    });
  } catch (error) {
    appendUatReport({
      test: "weekly-fork-threshold-met",
      step: "draft-weekly-rewards-minimal-happy-path",
      wallet: observerWallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

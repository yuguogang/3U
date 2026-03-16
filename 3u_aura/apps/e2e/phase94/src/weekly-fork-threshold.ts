import type { Page } from "@playwright/test";
import {
  executeAdminEpochSync,
  getMyProfile,
  previewAdminEpochSync,
  type ServerJsonResponse,
} from "./server-api";
import { loadRuntimeConfig, loadWalletFixture } from "./runtime";
import {
  bootstrapAdminSession,
  bootstrapDappSession,
} from "./session-bootstrap";
import {
  resolveWeeklyEpochByNo,
  seedThresholdMetFixtures,
} from "./weekly-fork-fixtures";
import { materializeWeeklyRewardsDraft } from "./weekly-fork-rewards";

const BASE_REFERENCE_AT = "2026-03-18T00:00:00.000Z";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function findThresholdMetWindow(accessToken: string) {
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

export async function prepareThresholdMetEpoch(params: {
  observerWalletName: "referrer" | "userA" | "userB" | "userC";
  page: Page;
}) {
  const runtime = loadRuntimeConfig();
  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const observerWallet = loadWalletFixture(
    params.observerWalletName,
    runtime.environment,
  );
  const observerSignin = await bootstrapDappSession(params.page, observerWallet);
  const observerProfile = (await getMyProfile(observerSignin.accessToken)).data;
  const adminSignin = await bootstrapAdminSession(params.page, adminWallet);
  const window = await findThresholdMetWindow(adminSignin.accessToken);
  const seeded = await seedThresholdMetFixtures({
    observerUserId: observerProfile.id,
    observerWallet: observerWallet.address,
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

  if (!thresholdEpoch) {
    throw new Error(
      `Threshold-met epoch not found for epochNo=${window.targetEpochNo}`,
    );
  }

  const draft = await materializeWeeklyRewardsDraft(thresholdEpoch.epochId);

  return {
    adminSignin,
    draft,
    epochSync: epochSync as ServerJsonResponse<{
      action: string;
      dryRun: boolean;
      result: unknown;
    }>,
    observerProfile,
    observerSignin,
    observerWallet,
    seeded,
    thresholdEpoch,
    window,
  };
}

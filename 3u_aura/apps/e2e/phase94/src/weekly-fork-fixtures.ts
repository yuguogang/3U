import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadRuntimeConfig } from "./runtime";

const execFileAsync = promisify(execFile);

type WeeklyThresholdFixtureSeedResult = {
  dateKeys: string[];
  minimumParticipants: number;
  observerWallet: string;
  participantCount: number;
  poolContributionAtomic: string;
  referenceAt: string;
  targetEpochNo: number;
};

type WeeklyForkEpochRecord = {
  epochNo: number;
  id: string;
  status: string;
};

export async function seedThresholdMetFixtures(params: {
  observerWallet: `0x${string}`;
  observerUserId: string;
  referenceAt: string;
  targetEndAt: string;
  targetEpochNo: number;
  targetStartAt: string;
}) {
  const runtime = loadRuntimeConfig();
  const scriptPath = `${runtime.repoRoot}/scripts/uat/seed-weekly-fork-fixtures.mjs`;
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    scriptPath,
    "--env",
    runtime.environment,
    "--observer-wallet",
    params.observerWallet,
    "--observer-user-id",
    params.observerUserId,
    "--reference-at",
    params.referenceAt,
    "--target-epoch-no",
    String(params.targetEpochNo),
    "--target-start-at",
    params.targetStartAt,
    "--target-end-at",
    params.targetEndAt,
  ]);

  if (stderr.trim()) {
    throw new Error(`weekly fixture seed stderr: ${stderr.trim()}`);
  }

  return JSON.parse(stdout) as WeeklyThresholdFixtureSeedResult;
}

export async function resolveWeeklyEpochByNo(epochNo: number) {
  const runtime = loadRuntimeConfig();
  const scriptPath = `${runtime.repoRoot}/scripts/uat/resolve-weekly-fork-epoch.mjs`;
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    scriptPath,
    "--env",
    runtime.environment,
    "--epoch-no",
    String(epochNo),
  ]);

  if (stderr.trim()) {
    throw new Error(`resolve weekly epoch stderr: ${stderr.trim()}`);
  }

  return JSON.parse(stdout) as WeeklyForkEpochRecord;
}

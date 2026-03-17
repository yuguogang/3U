import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadRuntimeConfig } from "./runtime";

const execFileAsync = promisify(execFile);

type DraftWeeklyRewardsResult = {
  dateKeyFromInclusive: string;
  dateKeyToExclusive: string;
  epochId: string;
  lottery: {
    consolationCount: number;
    draftRewardCount: number;
    lotteryRolloverUsdt: string;
  };
  merkle: {
    claimCount: number;
    leafCount: number;
    merkleRoot: string;
  };
  mode: "draft";
  ranking: {
    draftRewardCount: number;
    rankingRolloverUsdt: string;
  };
};

type PublishWeeklyRewardsResult = {
  claimCount: number;
  epochId: string;
  epochNo: number;
  merkleRoot: string;
  mode: "publish";
  rewardJsonUri: string;
  totalAmount: string;
};

export async function materializeWeeklyRewardsDraft(epochId: string) {
  const runtime = loadRuntimeConfig();
  const scriptPath = `${runtime.repoRoot}/scripts/uat/materialize-weekly-fork-draft.mjs`;
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      scriptPath,
      "--env",
      runtime.environment,
      "--epoch-id",
      epochId,
    ],
  );

  if (stderr.trim()) {
    throw new Error(`weekly reward draft stderr: ${stderr.trim()}`);
  }

  return JSON.parse(stdout) as DraftWeeklyRewardsResult;
}

export async function publishWeeklyRewards(epochId: string) {
  const runtime = loadRuntimeConfig();
  const scriptPath = `${runtime.repoRoot}/scripts/uat/publish-weekly-fork-claims.mjs`;
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    scriptPath,
    "--env",
    runtime.environment,
    "--epoch-id",
    epochId,
  ]);

  if (stderr.trim()) {
    throw new Error(`weekly reward publish stderr: ${stderr.trim()}`);
  }

  return JSON.parse(stdout) as PublishWeeklyRewardsResult;
}

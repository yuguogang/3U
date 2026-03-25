#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  approveUsdt,
  buyNft,
  depositMerkleRewards,
  getNftBalance,
  getPublishedSubsidyEpoch,
  mintUsdt,
  parseUnits,
  publishMerkleRoot,
  publishSubsidyEpoch,
} from '../ci/lib/contracts.mjs';
import { loadManifest, loadWalletFixture } from '../ci/lib/manifest.mjs';
import { REPO_ROOT } from '../promotion-env/lib.mjs';
import {
  parseWeeklyForkArgs,
  prepareWeeklyForkDatabase,
  readWeeklyForkRuntime,
  resetWeeklyForkDatabase,
  getWeeklyForkEnvDir,
  increaseWeeklyForkTime,
} from './weekly-fork-lib.mjs';
import {
  seedWeeklyForkFixtures,
  buildDatabaseConnectionConfig,
} from './seed-weekly-fork-fixtures.mjs';
import {
  startPromotionServices,
  stopPromotionServices,
} from './promotion-service-lib.mjs';

const requireFromServer = createRequire(
  new URL('../../apps/server/package.json', import.meta.url),
);
const { Client } = requireFromServer('pg');
const { privateKeyToAccount } = requireFromServer('viem/accounts');

const DEFAULT_TARGET_WALLET = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const SCENARIO_STATE_FILE = 'weekly-reward-scenario.state.json';
const LOTTERY_WINNER_BUFFER_SECONDS = 10 * 60;
const SUBSIDY_CLAIM_WINDOW_SECONDS = 7 * 24 * 60 * 60;
const SUBSIDY_AMOUNT_USDT = '30';

function readArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function hasFlag(name) {
  const flag = `--${name}`;
  return process.argv.includes(flag);
}

function getStatePath(envName) {
  return path.join(getWeeklyForkEnvDir(envName), SCENARIO_STATE_FILE);
}

function readScenarioState(envName) {
  const filePath = getStatePath(envName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeScenarioState(envName, value) {
  fs.writeFileSync(getStatePath(envName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function normalizeAddress(value) {
  return String(value).toLowerCase();
}

function resolveWalletFixtureByTarget(target, envName) {
  if (!target) {
    return loadWalletFixture('userA', envName);
  }

  if (target.startsWith('0x')) {
    const walletDir = path.join(getWeeklyForkEnvDir(envName), 'wallets');
    const walletFiles = fs
      .readdirSync(walletDir)
      .filter((entry) => entry.endsWith('.json') && !entry.startsWith('funding-'));

    for (const walletFile of walletFiles) {
      const fixture = JSON.parse(
        fs.readFileSync(path.join(walletDir, walletFile), 'utf8'),
      );
      if (normalizeAddress(fixture.address) === normalizeAddress(target)) {
        return fixture;
      }
    }

    throw new Error(`Wallet fixture not found for address ${target} in ${envName}`);
  }

  return loadWalletFixture(target, envName);
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} (${url}) ${await response.text()}`,
    );
  }

  return response.json();
}

async function signInBySignature(wallet, envName, { admin = false } = {}) {
  const manifest = loadManifest(envName);
  const account = privateKeyToAccount(wallet.privateKey);
  const messageUrl = new URL(
    '/api/v1/auth/signature_message',
    manifest.infra.server.publicApiBaseUrl,
  );
  messageUrl.searchParams.set('address', wallet.address);
  messageUrl.searchParams.set('scenario', 'SIGNIN');

  const message = await requestJson(messageUrl.toString());
  const signature = await account.signMessage({ message: message.message });
  const signinUrl = new URL(
    admin ? '/api/v1/admin/auth/login' : '/api/v1/auth/signature_signin',
    manifest.infra.server.publicApiBaseUrl,
  );

  return requestJson(signinUrl.toString(), {
    body: JSON.stringify({
      address: wallet.address,
      chain: wallet.chainId,
      device: 'BROWSER',
      name: wallet.name,
      signature,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });
}

async function requestAuthedJson(envName, accessToken, pathname, init = {}) {
  const manifest = loadManifest(envName);
  const url = new URL(pathname, manifest.infra.server.publicApiBaseUrl);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} (${pathname}) ${await response.text()}`,
    );
  }

  return response.json();
}

async function getMyProfile(envName, accessToken) {
  return requestAuthedJson(envName, accessToken, '/api/v1/user/profile');
}

async function getCurrentLottery(envName, accessToken) {
  return requestAuthedJson(envName, accessToken, '/api/v1/lottery/current');
}

async function participateLottery(envName, accessToken, epochId) {
  return requestAuthedJson(envName, accessToken, '/api/v1/lottery/participate', {
    body: JSON.stringify(epochId ? { epochId } : {}),
    method: 'POST',
  });
}

async function executeAdminEpochSync(envName, accessToken, referenceAt) {
  return requestAuthedJson(envName, accessToken, '/api/v1/admin/ops/epochs/sync', {
    body: JSON.stringify(referenceAt ? { referenceAt } : {}),
    method: 'POST',
  });
}

function spawnJsonScript(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`Command failed: ${args.join(' ')}${output ? `\n${output}` : ''}`);
  }

  return JSON.parse(result.stdout);
}

function buildTicketKey(epochId, userId) {
  return createHash('sha256').update(`${epochId}:${userId}`).digest('hex');
}

function chooseWinningParticipantSet({
  minimumParticipants,
  participants,
  targetUserId,
}) {
  const entries = participants
    .map((participant) => ({
      ...participant,
      ticketKey: buildTicketKey(participant.epochId, participant.userId),
    }))
    .sort((left, right) => left.ticketKey.localeCompare(right.ticketKey));
  const target = entries.find((entry) => entry.userId === targetUserId);

  if (!target) {
    throw new Error(`Target user ${targetUserId} not present in seeded participants`);
  }

  const lower = entries.filter((entry) => entry.ticketKey < target.ticketKey);
  const higher = entries.filter((entry) => entry.ticketKey > target.ticketKey);

  for (let totalParticipants = minimumParticipants; totalParticipants <= entries.length; totalParticipants += 1) {
    const winners = Math.floor(totalParticipants / 2);
    const maxLowerBeforeTarget = Math.max(0, winners - 1);

    for (let lowerCount = 0; lowerCount <= Math.min(lower.length, maxLowerBeforeTarget); lowerCount += 1) {
      const higherCount = totalParticipants - 1 - lowerCount;
      if (higherCount > higher.length) {
        continue;
      }

      const selected = [
        ...lower.slice(0, lowerCount),
        target,
        ...higher.slice(0, higherCount),
      ].sort((left, right) => left.ticketKey.localeCompare(right.ticketKey));
      const rank = selected.findIndex((entry) => entry.userId === targetUserId);
      if (rank !== -1 && rank < winners) {
        return {
          selected,
          targetRank: rank + 1,
          winnerCount: winners,
        };
      }
    }
  }

  throw new Error('Unable to build a participant set that guarantees target lottery win');
}

async function markParticipatingTickets({
  envName,
  epochId,
  participants,
  streakDays,
  targetWallet,
}) {
  const manifest = loadManifest(envName);
  const client = new Client(buildDatabaseConnectionConfig(manifest));
  const schema = manifest.infra.database.schema;

  await client.connect();

  try {
    await client.query('BEGIN');

    for (const participant of participants) {
      if (normalizeAddress(participant.walletAddress) === normalizeAddress(targetWallet)) {
        continue;
      }

      const ticketId = `wf03_ticket_${epochId}_${participant.userId}`;

      await client.query(
        `
          INSERT INTO "${schema}"."LotteryTicket" (
            "id",
            "epochId",
            "userId",
            "streakDays",
            "isEligible",
            "ticketCount",
            "isParticipating",
            "participatedAt",
            "qualifiedAt",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            TRUE,
            1,
            TRUE,
            NOW(),
            NOW(),
            NOW(),
            NOW()
          )
          ON CONFLICT ("epochId", "userId")
          DO UPDATE SET
            "streakDays" = EXCLUDED."streakDays",
            "isEligible" = TRUE,
            "ticketCount" = 1,
            "isParticipating" = TRUE,
            "participatedAt" = COALESCE("${schema}"."LotteryTicket"."participatedAt", NOW()),
            "qualifiedAt" = COALESCE("${schema}"."LotteryTicket"."qualifiedAt", NOW()),
            "updatedAt" = NOW()
        `,
        [ticketId, epochId, participant.userId, streakDays],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function findPromotionEpochByNo(envName, epochNo) {
  const manifest = loadManifest(envName);
  const client = new Client(buildDatabaseConnectionConfig(manifest));
  const schema = manifest.infra.database.schema;

  await client.connect();

  try {
    const result = await client.query(
      `
        SELECT "id", "epochNo", "status", "startAt", "endAt"
        FROM "${schema}"."WeeklyEpoch"
        WHERE "epochType" = 'WEEKLY_PROMOTION'
          AND "epochNo" = $1
        LIMIT 1
      `,
      [epochNo],
    );

    return result.rows[0] ?? null;
  } finally {
    await client.end();
  }
}

async function readLatestBlockTimestampSeconds(envName) {
  const runtime = readWeeklyForkRuntime(envName);
  if (!runtime) {
    throw new Error(`Fork runtime for ${envName} is not running`);
  }

  const response = await fetch(runtime.anvilRpcUrl, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to read latest block timestamp: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  return Number.parseInt(payload.result?.timestamp ?? '0x0', 16);
}

async function ensureScenarioStack({
  envName,
  reset,
  restartServices,
}) {
  const weeklyOptions = {
    ...parseWeeklyForkArgs([]),
    envName,
  };

  const existingRuntime = readWeeklyForkRuntime(envName);
  if (!existingRuntime?.pid) {
    throw new Error(
      `Fork runtime for ${envName} is not running. Start the fork first, then rerun the scenario runner.`,
    );
  }

  const shouldRestartServer = reset || restartServices;
  if (shouldRestartServer) {
    await stopPromotionServices({
      envName,
      includeUnmanaged: true,
      services: ['server'],
    });
  }

  if (reset) {
    await resetWeeklyForkDatabase(weeklyOptions);
  } else {
    await prepareWeeklyForkDatabase(weeklyOptions);
  }

  return startPromotionServices({
    envName,
    services: ['server'],
  });
}

async function syncPurchasedNftState(envName, walletAddress) {
  return spawnJsonScript([
    path.join(REPO_ROOT, 'scripts', 'uat', 'sync-weekly-fork-purchased-nft-state.mjs'),
    '--env',
    envName,
    '--wallet',
    walletAddress,
  ]);
}

function toIsoAfter(dateString, seconds) {
  return new Date(new Date(dateString).getTime() + seconds * 1000).toISOString();
}

async function preparePhase({
  autoBuyTargetNft,
  autoTargetLottery,
  envName,
  reset,
  restartServices,
  targetWallet,
}) {
  const serviceRuntime = await ensureScenarioStack({
    envName,
    reset,
    restartServices,
  });
  const adminWallet = loadWalletFixture('admin', envName);
  const targetSignin = await signInBySignature(targetWallet, envName);
  const [profile, currentLottery] = await Promise.all([
    getMyProfile(envName, targetSignin.accessToken),
    getCurrentLottery(envName, targetSignin.accessToken),
  ]);

  const seeded = await seedWeeklyForkFixtures({
    envName,
    observerUserId: profile.id,
    observerWallet: targetWallet.address,
    poolContributorCount: 10,
    qualifiedRankingCount: 15,
    referenceAt: currentLottery.startAt,
    syntheticParticipantCount: 18,
    targetEndAt: currentLottery.endAt,
    targetEpochNo: currentLottery.epochNo,
    targetStartAt: currentLottery.startAt,
  });
  const scopedParticipants = seeded.participants.map((participant) => ({
    ...participant,
    epochId: currentLottery.epochId,
  }));
  const winnerPlan = chooseWinningParticipantSet({
    minimumParticipants: seeded.minimumParticipants,
    participants: scopedParticipants,
    targetUserId: profile.id,
  });

  await markParticipatingTickets({
    envName,
    epochId: currentLottery.epochId,
    participants: winnerPlan.selected,
    streakDays: seeded.dateKeys.length,
    targetWallet: targetWallet.address,
  });

  let joinedLottery = false;
  if (autoTargetLottery) {
    await participateLottery(envName, targetSignin.accessToken, currentLottery.epochId);
    joinedLottery = true;
  }

  let purchasedNft = null;
  if (autoBuyTargetNft) {
    const manifest = loadManifest(envName);
    await mintUsdt(targetWallet.address, parseUnits('1000', 6), envName);
    await approveUsdt(
      targetWallet,
      manifest.contracts.nftSaleAddress,
      parseUnits('1000', 6),
      envName,
    );
    const buyHash = await buyNft(targetWallet, 1, envName);
    purchasedNft = await requestAuthedJson(
      envName,
      targetSignin.accessToken,
      '/api/v1/claims/purchased-nft/sync',
      {
        body: JSON.stringify({ txHash: buyHash }),
        method: 'POST',
      },
    );
  }

  const refreshedLottery = await getCurrentLottery(envName, targetSignin.accessToken);
  const state = {
    adminWalletAddress: adminWallet.address,
    autoParticipantWallets: winnerPlan.selected
      .filter((participant) => participant.userId !== profile.id)
      .map((participant) => participant.walletAddress),
    currentLottery: refreshedLottery,
    envName,
    preparedAt: new Date().toISOString(),
    seeded,
    serviceRuntime,
    targetUserId: profile.id,
    targetWalletAddress: targetWallet.address,
    targetWalletName: targetWallet.name,
    targetWinningRank: winnerPlan.targetRank,
    targetWinnerCount: winnerPlan.winnerCount,
  };
  writeScenarioState(envName, state);

  return {
    joinedLottery,
    nextActions: [
      joinedLottery
        ? 'Lottery already joined by script; you can skip the Check-In join step.'
        : `Open ${loadManifest(envName).infra.dapp.baseUrl}/checkin and click "参与本周抽奖".`,
      purchasedNft
        ? 'Purchased NFT already prepared by script; you can go straight to settle/publish.'
        : `Optional: open ${loadManifest(envName).infra.dapp.baseUrl}/nft and buy one Purchased NFT with ${targetWallet.address}.`,
      `If DApp is not running yet, start it manually and then open ${loadManifest(envName).infra.dapp.baseUrl}.`,
      `If Admin is not running yet, start it manually and then open ${loadManifest(envName).infra.admin.baseUrl}.`,
      `Then run: node scripts/uat/run-weekly-fork-scenarios.mjs --env ${envName} --phase settle --target-wallet ${targetWallet.address}`,
    ],
    refreshedLottery,
    state,
  };
}

async function settlePhase({
  autoTargetLottery,
  envName,
  restartServices,
  targetWallet,
}) {
  await ensureScenarioStack({
    envName,
    reset: false,
    restartServices,
  });

  const state = readScenarioState(envName);
  if (!state) {
    throw new Error(
      `Scenario state not found for ${envName}. Run the prepare phase first.`,
    );
  }

  const adminWallet = loadWalletFixture('admin', envName);
  const targetSignin = await signInBySignature(targetWallet, envName);
  const adminSignin = await signInBySignature(adminWallet, envName, {
    admin: true,
  });
  const currentLottery = await getCurrentLottery(envName, targetSignin.accessToken);

  if (!currentLottery.isParticipating) {
    if (!autoTargetLottery) {
      throw new Error(
        `Target wallet ${targetWallet.address} has not joined the lottery yet. Join in DApp Check-In before running settle.`,
      );
    }

    await participateLottery(envName, targetSignin.accessToken, currentLottery.epochId);
  }

  const targetTimestamp = Math.floor(
    new Date(currentLottery.endAt).getTime() / 1000,
  ) + LOTTERY_WINNER_BUFFER_SECONDS;
  const latestBlockTimestamp = await readLatestBlockTimestampSeconds(envName);
  if (targetTimestamp > latestBlockTimestamp) {
    await increaseWeeklyForkTime({
      envName,
      seconds: targetTimestamp - latestBlockTimestamp,
    });
  }

  const referenceAt = toIsoAfter(currentLottery.endAt, LOTTERY_WINNER_BUFFER_SECONDS);
  const epochSync = await executeAdminEpochSync(
    envName,
    adminSignin.accessToken,
    referenceAt,
  );
  const epochRecord = await findPromotionEpochByNo(envName, currentLottery.epochNo);
  if (!epochRecord?.id) {
    throw new Error(`Weekly promotion epoch #${currentLottery.epochNo} was not materialized`);
  }

  const draft = spawnJsonScript([
    path.join(REPO_ROOT, 'scripts', 'uat', 'materialize-weekly-fork-draft.mjs'),
    '--env',
    envName,
    '--epoch-id',
    epochRecord.id,
  ]);
  const published = spawnJsonScript([
    path.join(REPO_ROOT, 'scripts', 'uat', 'publish-weekly-fork-claims.mjs'),
    '--env',
    envName,
    '--epoch-id',
    epochRecord.id,
  ]);

  if (BigInt(published.totalAmount) > 0n) {
    await depositMerkleRewards(adminWallet, BigInt(published.totalAmount), envName);
    await publishMerkleRoot(
      adminWallet,
      published.epochNo,
      published.merkleRoot,
      envName,
    );
  }

  let subsidy = {
    published: false,
    skippedReason: 'target wallet does not hold a purchased NFT on-chain',
  };
  try {
    const targetNftBalance = await getNftBalance(targetWallet.address, envName);
    if (targetNftBalance > 0n) {
      let subsidyEpochId = null;
      const manifest = loadManifest(envName);
      for (
        let epochId = 1;
        epochId <= Number(manifest.contracts.maxSubsidyEpochs ?? 12);
        epochId += 1
      ) {
        const epoch = await getPublishedSubsidyEpoch(epochId, envName);
        if (!epoch[7]) {
          subsidyEpochId = epochId;
          break;
        }
      }

      if (subsidyEpochId === null) {
        subsidy = {
          published: false,
          skippedReason: 'no unpublished subsidy epoch remains on-chain',
        };
      } else {
        const subsidyPublishHash = await publishSubsidyEpoch(
          adminWallet,
          {
            claimDeadline: BigInt(targetTimestamp + SUBSIDY_CLAIM_WINDOW_SECONDS),
            epochId: subsidyEpochId,
            subsidyAmount: parseUnits(SUBSIDY_AMOUNT_USDT, 6),
          },
          envName,
        );
        const subsidySync = await syncPurchasedNftState(envName, targetWallet.address);
        subsidy = {
          claimWindowSeconds: SUBSIDY_CLAIM_WINDOW_SECONDS,
          epochId: subsidyEpochId,
          published: true,
          subsidyAmountUsdt: SUBSIDY_AMOUNT_USDT,
          sync: subsidySync,
          txHash: subsidyPublishHash,
        };
      }
    }
  } catch (error) {
    subsidy = {
      published: false,
      skippedReason: `nft subsidy skipped: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const nextState = {
    ...state,
    settledAt: new Date().toISOString(),
    settleSummary: {
      draft,
      epochRecord,
      epochSync,
      published,
      referenceAt,
      subsidy,
    },
  };
  writeScenarioState(envName, nextState);

  return {
    draft,
    epochRecord,
    epochSync,
    nextActions: [
      `If DApp is not running yet, start it manually and then open ${loadManifest(envName).infra.dapp.baseUrl}.`,
      `Open ${loadManifest(envName).infra.dapp.baseUrl}/rewards and reveal the lottery result.`,
      `Open ${loadManifest(envName).infra.dapp.baseUrl}/claims and claim ranking / lottery rewards after reveal.`,
      subsidy.published
        ? `Open ${loadManifest(envName).infra.dapp.baseUrl}/claims and claim the NFT weekly subsidy.`
        : `NFT subsidy skipped: ${subsidy.skippedReason}`,
      `If Admin is not running yet, start it manually and then open ${loadManifest(envName).infra.admin.baseUrl}.`,
      `Admin can verify publication at ${loadManifest(envName).infra.admin.baseUrl}/overview and ${loadManifest(envName).infra.admin.baseUrl}/ops.`,
    ],
    published,
    subsidy,
  };
}

function parseCliOptions() {
  return {
    autoBuyTargetNft: hasFlag('auto-buy-target-nft'),
    autoTargetLottery: hasFlag('auto-target-lottery'),
    envName: readArg('env') ?? 'fork-anvil',
    phase: readArg('phase') ?? 'prepare',
    reset: hasFlag('reset'),
    restartServices: hasFlag('restart-services'),
    target: readArg('target-wallet') ?? DEFAULT_TARGET_WALLET,
  };
}

async function main() {
  const options = parseCliOptions();
  const targetWallet = resolveWalletFixtureByTarget(options.target, options.envName);

  let result;
  if (options.phase === 'prepare') {
    result = await preparePhase({
      autoBuyTargetNft: options.autoBuyTargetNft,
      autoTargetLottery: options.autoTargetLottery,
      envName: options.envName,
      reset: options.reset,
      restartServices: options.restartServices,
      targetWallet,
    });
  } else if (options.phase === 'settle') {
    result = await settlePhase({
      autoTargetLottery: options.autoTargetLottery,
      envName: options.envName,
      restartServices: options.restartServices,
      targetWallet,
    });
  } else {
    throw new Error(`Unsupported --phase ${options.phase}. Use prepare or settle.`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

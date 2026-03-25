import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  approveUsdt,
  claimMerkleReward,
  createTestClientForFork,
  depositMerkleRewards,
  isMerkleClaimed,
  mintUsdt,
  publishMerkleRoot,
} from './contracts.mjs';
import { loadWalletFixture, loadManifest } from './manifest.mjs';
import {
  adminEpochSync,
  getAccessToken,
  getMyClaims,
  syncClaim,
} from './server.mjs';
import { cleanupHarness, prepareHarness } from './harness.mjs';

const execFileAsync = promisify(execFile);

const ENV = 'fork-anvil';
const TARGET_EPOCH_NO = 1;

function addDays(isoString, days) {
  const date = new Date(isoString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function runNodeScript(args) {
  const { stdout, stderr } = await execFileAsync('node', args, {
    cwd: process.cwd(),
    env: process.env,
  });

  if (stderr?.trim()) {
    console.log(stderr.trim());
  }

  return stdout.trim();
}

async function resolveWeeklyEpochId(epochNo) {
  const stdout = await runNodeScript([
    'scripts/uat/resolve-weekly-fork-epoch.mjs',
    '--env',
    ENV,
    '--epoch-no',
    String(epochNo),
  ]);
  return JSON.parse(stdout);
}

function toRewardTypeCode(claimType) {
  if (claimType === 'MERKLE_LOTTERY') {
    return 1;
  }
  if (claimType === 'MERKLE_RANKING') {
    return 2;
  }
  throw new Error(`Unsupported merkle claim type: ${claimType}`);
}

function pickMerkleClaim(claimsView, targetClaimType) {
  const claim = claimsView.merkleClaims?.find((item) => item.claimType === targetClaimType);
  if (!claim) {
    const availableTypes = Array.from(
      new Set((claimsView.merkleClaims ?? []).map((item) => item.claimType)),
    );
    throw new Error(
      `Expected weekly merkle claim of type ${targetClaimType}, available: ${availableTypes.join(', ') || 'none'}`,
    );
  }
  return claim;
}

async function resolveClaimantForType(loginsByName, targetClaimType) {
  for (const [walletName, login] of Object.entries(loginsByName)) {
    const claimsView = await getMyClaims(login.accessToken, ENV);
    const claim = claimsView.merkleClaims?.find((item) => item.claimType === targetClaimType);
    if (claim) {
      return {
        walletName,
        login,
        claimsView,
        claim,
      };
    }
  }

  throw new Error(`Expected at least one known test wallet to have claim type ${targetClaimType}`);
}

export async function runWeeklyMerkleClaimFlow({
  claimType,
  label,
  rewardJsonUri,
}) {
  console.log(`\n========== ${label} Flow Test ==========\n`);

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const admin = loadWalletFixture('admin', ENV);
  const userA = loadWalletFixture('userA', ENV);
  const userB = loadWalletFixture('userB', ENV);
  const manifest = loadManifest(ENV);
  const testClient = createTestClientForFork(ENV);

  console.log(`3. Candidate claimants: ${userA.address}, ${userB.address}`);
  console.log(`   Root publisher / owner: ${admin.address}`);
  console.log(`   Target claim type: ${claimType}`);

  console.log('4. Logging in admin and candidate claimants...');
  const [adminLogin, userALogin, userBLogin] = await Promise.all([
    getAccessToken(admin.address, admin.privateKey, ENV),
    getAccessToken(userA.address, userA.privateKey, ENV),
    getAccessToken(userB.address, userB.privateKey, ENV),
  ]);

  const promotionStartAt = manifest.promotion.startAt;
  const targetStartAt = new Date(promotionStartAt).toISOString();
  const targetEndAt = addDays(targetStartAt, 7);
  const referenceAt = addDays(targetEndAt, 1);

  console.log('5. Seeding weekly fixture data...');
  const seededFixture = JSON.parse(
    await runNodeScript([
      'scripts/uat/seed-weekly-fork-fixtures.mjs',
      '--env',
      ENV,
      '--observer-wallet',
      userB.address,
      '--reference-at',
      referenceAt,
      '--target-epoch-no',
      String(TARGET_EPOCH_NO),
      '--target-start-at',
      targetStartAt,
      '--target-end-at',
      targetEndAt,
    ]),
  );
  console.log(`   Seeded fixture: ${JSON.stringify(seededFixture)}`);

  console.log('6. Running admin epoch sync to materialize weekly epoch...');
  const epochSync = await adminEpochSync(adminLogin.accessToken, referenceAt, ENV);
  console.log(`   Epoch sync result: ${JSON.stringify(epochSync)}`);

  console.log('7. Resolving created weekly epoch...');
  const epoch = await resolveWeeklyEpochId(TARGET_EPOCH_NO);
  console.log(`   Weekly epoch: ${JSON.stringify(epoch)}`);

  console.log('8. Materializing weekly draft rewards and merkle claims...');
  const materialized = JSON.parse(
    await runNodeScript([
      'scripts/uat/materialize-weekly-fork-draft.mjs',
      '--env',
      ENV,
      '--epoch-id',
      epoch.id,
    ]),
  );
  console.log(`   Materialized draft: ${JSON.stringify(materialized)}`);
  if (!materialized.merkle?.claimCount) {
    throw new Error('Expected materialized weekly draft to create merkle claims');
  }

  console.log('9. Publishing weekly claims in DB...');
  const published = JSON.parse(
    await runNodeScript([
      'scripts/uat/publish-weekly-fork-claims.mjs',
      '--env',
      ENV,
      '--epoch-id',
      epoch.id,
      '--reward-json-uri',
      rewardJsonUri,
    ]),
  );
  console.log(`   Published claims: ${JSON.stringify(published)}`);

  console.log('10. Funding merkle distributor and publishing root on-chain...');
  await mintUsdt(admin.address, BigInt(published.totalAmount), ENV);
  await approveUsdt(
    admin,
    manifest.contracts.merkleDistributorAddress,
    BigInt(published.totalAmount),
    ENV,
  );
  const depositTx = await depositMerkleRewards(admin, BigInt(published.totalAmount), ENV);
  const rootTx = await publishMerkleRoot(admin, TARGET_EPOCH_NO, published.merkleRoot, ENV);
  console.log(`   Deposit tx: ${depositTx}`);
  console.log(`   Root publish tx: ${rootTx}`);
  const activated = JSON.parse(
    await runNodeScript([
      'scripts/uat/activate-weekly-fork-claims.mjs',
      '--env',
      ENV,
      '--epoch-id',
      epoch.id,
      '--merkle-root',
      published.merkleRoot,
      '--reward-json-uri',
      rewardJsonUri,
    ]),
  );
  console.log(`   Activated claims: ${JSON.stringify(activated)}`);

  console.log('11. Resolving claimant with target merkle claim from server...');
  const claimantResolution = await resolveClaimantForType(
    {
      userA: userALogin,
      userB: userBLogin,
    },
    claimType,
  );
  const claimantWallet =
    claimantResolution.walletName === 'userA' ? userA : userB;
  const userLogin = claimantResolution.login;
  const claimsBefore = claimantResolution.claimsView;
  const merkleClaim = claimantResolution.claim;
  console.log(`   Selected claimant: ${claimantResolution.walletName} (${claimantWallet.address})`);
  console.log(`   Pending merkle claim: ${JSON.stringify(merkleClaim)}`);
  if (merkleClaim.status !== 'CLAIMABLE') {
    throw new Error(`Expected merkle claim status CLAIMABLE, got ${merkleClaim.status}`);
  }

  console.log('12. Claiming weekly reward on-chain...');
  const claimTx = await claimMerkleReward(
    claimantWallet,
    {
      amount: merkleClaim.amount,
      epochId: merkleClaim.epochNo,
      index: merkleClaim.merkleIndex,
      merkleProof: merkleClaim.merkleProof,
      rewardTypeCode: toRewardTypeCode(merkleClaim.claimType),
    },
    ENV,
  );
  await testClient.mine({ blocks: 1 });
  console.log(`   Claim tx: ${claimTx}`);

  const claimedOnChain = await isMerkleClaimed(merkleClaim.epochNo, merkleClaim.merkleIndex, ENV);
  if (!claimedOnChain) {
    throw new Error('Expected merkle claim to be marked claimed on-chain');
  }

  console.log('12b. Verifying duplicate on-chain merkle claim is rejected...');
  let duplicateClaimRejected = false;
  try {
    await claimMerkleReward(
      claimantWallet,
      {
        amount: merkleClaim.amount,
        epochId: merkleClaim.epochNo,
        index: merkleClaim.merkleIndex,
        merkleProof: merkleClaim.merkleProof,
        rewardTypeCode: toRewardTypeCode(merkleClaim.claimType),
      },
      ENV,
    );
  } catch (error) {
    duplicateClaimRejected = true;
    console.log(`   Duplicate on-chain claim rejected: ${error.message}`);
  }
  if (!duplicateClaimRejected) {
    throw new Error('Expected duplicate on-chain merkle claim to be rejected');
  }

  console.log('13. Syncing merkle claim back to server...');
  const syncResult = await syncClaim(
    userLogin.accessToken,
    {
      claimRecordId: merkleClaim.claimRecordId,
      txHash: claimTx,
    },
    ENV,
  );
  console.log(`   Claim sync result: ${JSON.stringify(syncResult)}`);
  if (syncResult.status !== 'CLAIMED') {
    throw new Error(`Expected merkle sync result CLAIMED, got ${syncResult.status}`);
  }

  console.log('14. Verifying duplicate merkle sync is idempotent...');
  const duplicateSync = await syncClaim(
    userLogin.accessToken,
    {
      claimRecordId: merkleClaim.claimRecordId,
      txHash: claimTx,
    },
    ENV,
  );
  console.log(`   Duplicate sync result: ${JSON.stringify(duplicateSync)}`);

  console.log('15. Verifying claim becomes CLAIMED in claims view...');
  const claimsAfter = await getMyClaims(userLogin.accessToken, ENV);
  const claimedMerkleClaim = pickMerkleClaim(claimsAfter, claimType);
  console.log(`   Claimed merkle claim: ${JSON.stringify(claimedMerkleClaim)}`);
  if (claimedMerkleClaim.status !== 'CLAIMED') {
    throw new Error(`Expected claimed merkle status CLAIMED, got ${claimedMerkleClaim.status}`);
  }
  if (claimedMerkleClaim.txHash?.toLowerCase() !== claimTx.toLowerCase()) {
    throw new Error('Expected claimed merkle row to persist claim txHash');
  }

  console.log('\n16. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
    stopAnvil: false,
  });

  console.log(`\n✅ ${label} completed successfully!\n`);
  return { success: true };
}

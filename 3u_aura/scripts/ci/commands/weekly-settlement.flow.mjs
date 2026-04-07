import {
  depositMerkleRewards,
  mintUsdt,
  parseEther,
  publishMerkleRoot,
  setBalance,
} from '../lib/contracts.mjs';
import { addDays, seedWeeklyEpochScenario } from '../lib/weekly-fixture.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';
import { loadManifest, loadWalletFixture } from '../lib/manifest.mjs';
import {
  adminEpochSync,
  executeRewardPublication,
  executeWeeklySettlementDraft,
  executeWeeklySettlementPublish,
  getAccessToken,
  getMyProfile,
  getWeeklySettlement,
  previewRewardPublication,
} from '../lib/server.mjs';

const ENV = 'fork-anvil';
const TARGET_EPOCH_NO = 1;

async function runScenario({
  adminLogin,
  adminWallet,
  label,
  observerUserId,
  observerWallet,
  rewardJsonUri,
  selectedParticipantCount,
  syntheticParticipantCount,
  expectLotteryStatus,
  expectRankingStatus,
  expectedMinTotalRewardAtomic,
}) {
  console.log(`\n----- Weekly scenario: ${label} -----`);
  const manifest = loadManifest(ENV);
  const referenceAt = addDays(
    addDays(new Date(manifest.promotion.startAt).toISOString(), manifest.promotion.epochLengthDays),
    1,
  );

  const seeded = await seedWeeklyEpochScenario({
    envName: ENV,
    epochNo: TARGET_EPOCH_NO,
    observerUserId,
    observerWallet,
    referenceAt,
    selectedParticipantCount,
    syntheticParticipantCount,
  });

  console.log(`   Seeded fixture: ${JSON.stringify({
    participantWallets: seeded.seeded.participantWallets.length,
    selectedParticipantCount,
    syntheticParticipantCount,
  })}`);

  const epochSync = await adminEpochSync(adminLogin.accessToken, referenceAt, ENV);
  console.log(`   Epoch sync: ${JSON.stringify(epochSync)}`);

  const overviewAfterSync = await getWeeklySettlement(
    adminLogin.accessToken,
    { epochNo: TARGET_EPOCH_NO, referenceAt },
    ENV,
  );
  console.log(`   Weekly overview after sync: ${JSON.stringify(overviewAfterSync.selectedEpoch)}`);
  const selectedEpoch = overviewAfterSync.selectedEpoch;
  if (!selectedEpoch) {
    throw new Error('Expected weekly settlement center to return selectedEpoch');
  }
  if (selectedEpoch.lotteryStatus !== expectLotteryStatus) {
    throw new Error(
      `Expected lotteryStatus ${expectLotteryStatus}, got ${selectedEpoch.lotteryStatus}`,
    );
  }
  if (selectedEpoch.rankingStatus !== expectRankingStatus) {
    throw new Error(
      `Expected rankingStatus ${expectRankingStatus}, got ${selectedEpoch.rankingStatus}`,
    );
  }
  const lotteryPool = BigInt(selectedEpoch.lotteryPoolUsdt);
  const rankingPool = BigInt(selectedEpoch.rankingPoolUsdt);
  const splitDelta = lotteryPool > rankingPool ? lotteryPool - rankingPool : rankingPool - lotteryPool;
  if (splitDelta > 1n) {
    throw new Error(
      `Expected 50/50 pool split, got lottery=${selectedEpoch.lotteryPoolUsdt} ranking=${selectedEpoch.rankingPoolUsdt}`,
    );
  }

  const draftResult = await executeWeeklySettlementDraft(
    adminLogin.accessToken,
    TARGET_EPOCH_NO,
    ENV,
  );
  console.log(`   Draft result: ${JSON.stringify(draftResult)}`);

  const publishResult = await executeWeeklySettlementPublish(
    adminLogin.accessToken,
    TARGET_EPOCH_NO,
    ENV,
  );
  console.log(`   Publish result: ${JSON.stringify(publishResult)}`);

  const previewBeforeFunding = await previewRewardPublication(
    adminLogin.accessToken,
    TARGET_EPOCH_NO,
    ENV,
  );
  console.log(`   Publication preview before funding/root: ${JSON.stringify(previewBeforeFunding)}`);
  if (BigInt(previewBeforeFunding.result.totalRewardAmountAtomic) < BigInt(expectedMinTotalRewardAtomic)) {
    throw new Error(
      `Expected totalRewardAmountAtomic >= ${expectedMinTotalRewardAtomic}, got ${previewBeforeFunding.result.totalRewardAmountAtomic}`,
    );
  }
  if (
    !previewBeforeFunding.result.blockers.some((item) =>
      item.includes('weekly root is not published on-chain'),
    )
  ) {
    throw new Error(
      `Expected pre-publication blocker for unpublished root, got ${JSON.stringify(previewBeforeFunding.result.blockers)}`,
    );
  }

  await mintUsdt(
    manifest.roles.rewardFunderAddress,
    BigInt(previewBeforeFunding.result.totalRewardAmountAtomic),
    ENV,
  );
  await setBalance(manifest.roles.rewardFunderAddress, parseEther('1'), ENV);
  await depositMerkleRewards(
    adminWallet,
    BigInt(previewBeforeFunding.result.totalRewardAmountAtomic),
    ENV,
  );
  await publishMerkleRoot(
    adminWallet,
    TARGET_EPOCH_NO,
    previewBeforeFunding.result.draftMerkleRoot,
    ENV,
  );

  const previewAfterFunding = await previewRewardPublication(
    adminLogin.accessToken,
    TARGET_EPOCH_NO,
    ENV,
  );
  console.log(`   Publication preview after funding/root: ${JSON.stringify(previewAfterFunding)}`);
  if (!previewAfterFunding.result.canActivate) {
    throw new Error(
      `Expected reward publication to be activatable, got blockers ${JSON.stringify(previewAfterFunding.result.blockers)}`,
    );
  }

  const activation = await executeRewardPublication(
    adminLogin.accessToken,
    TARGET_EPOCH_NO,
    rewardJsonUri,
    ENV,
  );
  console.log(`   Activation result: ${JSON.stringify(activation)}`);

  const overviewAfterActivation = await getWeeklySettlement(
    adminLogin.accessToken,
    { epochNo: TARGET_EPOCH_NO, referenceAt },
    ENV,
  );
  console.log(`   Weekly overview after activation: ${JSON.stringify(overviewAfterActivation.selectedEpoch)}`);
  if (overviewAfterActivation.selectedEpoch?.merkleRoot !== previewBeforeFunding.result.draftMerkleRoot) {
    throw new Error('Expected activated epoch to persist the published merkle root');
  }
  if (expectLotteryStatus === 'CANCELLED') {
    if (overviewAfterActivation.selectedEpoch?.lotteryStatus !== 'CANCELLED') {
      throw new Error(
        `Expected lottery lane to remain CANCELLED after activation, got ${overviewAfterActivation.selectedEpoch?.lotteryStatus}`,
      );
    }
    if (overviewAfterActivation.selectedEpoch?.rankingStatus !== 'ROOT_POSTED') {
      throw new Error(
        `Expected ranking lane to activate independently, got ${overviewAfterActivation.selectedEpoch?.rankingStatus}`,
      );
    }
  } else {
    if (overviewAfterActivation.selectedEpoch?.lotteryStatus !== 'ROOT_POSTED') {
      throw new Error(
        `Expected lottery lane ROOT_POSTED after activation, got ${overviewAfterActivation.selectedEpoch?.lotteryStatus}`,
      );
    }
    if (overviewAfterActivation.selectedEpoch?.rankingStatus !== 'ROOT_POSTED') {
      throw new Error(
        `Expected ranking lane ROOT_POSTED after activation, got ${overviewAfterActivation.selectedEpoch?.rankingStatus}`,
      );
    }
  }
}

async function run() {
  console.log('\n========== Weekly Settlement API Flow Test ==========\n');

  const admin = loadWalletFixture('admin', ENV);
  const userA = loadWalletFixture('userA', ENV);

  try {
    console.log('3. Preparing happy-path weekly settlement harness...');
    await prepareHarness({
      deployFreshContracts: true,
      envName: ENV,
      resetDb: true,
      startServices: ['server'],
    });

    const [adminLogin, userALogin] = await Promise.all([
      getAccessToken(admin.address, admin.privateKey, ENV),
      getAccessToken(userA.address, userA.privateKey, ENV),
    ]);
    const userAProfile = await getMyProfile(userALogin.accessToken, ENV);

    await runScenario({
      adminLogin,
      adminWallet: admin,
      expectLotteryStatus: 'CALCULATING',
      expectRankingStatus: 'CALCULATING',
      expectedMinTotalRewardAtomic: '1',
      label: 'happy-path',
      observerUserId: userAProfile.id,
      observerWallet: userA.address,
      rewardJsonUri: 'ipfs://ci/weekly-settlement-happy.json',
      selectedParticipantCount: 14,
      syntheticParticipantCount: 18,
    });

    console.log('\n18. Resetting harness for lottery-rollover/ranking-live scenario...');
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
      stopAnvil: false,
    });

    await prepareHarness({
      deployFreshContracts: true,
      envName: ENV,
      resetDb: true,
      startServices: ['server'],
    });

    const [adminLoginRollover, userALoginRollover] = await Promise.all([
      getAccessToken(admin.address, admin.privateKey, ENV),
      getAccessToken(userA.address, userA.privateKey, ENV),
    ]);
    const rolloverProfile = await getMyProfile(userALoginRollover.accessToken, ENV);

    await runScenario({
      adminLogin: adminLoginRollover,
      adminWallet: admin,
      expectLotteryStatus: 'CANCELLED',
      expectRankingStatus: 'CALCULATING',
      expectedMinTotalRewardAtomic: '1',
      label: 'lottery-rollover-ranking-still-settles',
      observerUserId: rolloverProfile.id,
      observerWallet: userA.address,
      rewardJsonUri: 'ipfs://ci/weekly-settlement-rollover.json',
      selectedParticipantCount: 6,
      syntheticParticipantCount: 0,
    });

    console.log('\n19. Cleaning up harness...');
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
      stopAnvil: false,
    });

    console.log('\n✅ Weekly settlement API flow completed successfully!\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ Weekly settlement API flow failed:', error.message);
    console.error(error.stack);
    try {
      await cleanupHarness({
        envName: ENV,
        stopServices: ['server'],
        stopAnvil: false,
      });
    } catch {}
    process.exit(1);
  }
}

run();

import { loadManifest, loadWalletFixture } from '../lib/manifest.mjs';
import {
  approveUsdt,
  buyNft,
  claimSubsidy,
  createPublicClientForFork,
  createTestClientForFork,
  getPublishedSubsidyEpoch,
  isSubsidyClaimed,
  mintUsdt,
  parseUnits,
  publishSubsidyEpoch,
} from '../lib/contracts.mjs';
import {
  getAccessToken,
  getMyClaims,
  syncClaim,
  syncPurchasedNft,
} from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';
const SUBSIDY_EPOCH_ID = 1;
const SUBSIDY_AMOUNT_USDT = '30';
const PURCHASE_PRICE_USDT = '1000';

function normalizeClaim(claimsView) {
  const claim = claimsView.nftSubsidyClaims?.[0];
  if (!claim) {
    throw new Error('Expected at least one NFT subsidy claim');
  }
  return claim;
}

async function run() {
  console.log('\n========== Subsidy Claim Flow Test ==========\n');

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const admin = loadWalletFixture('admin', ENV);
  const userB = loadWalletFixture('userB', ENV);
  const manifest = loadManifest(ENV);
  const publicClient = createPublicClientForFork(ENV);
  const testClient = createTestClientForFork(ENV);

  console.log(`3. Buyer: ${userB.address}`);
  console.log(`   Settlement owner: ${admin.address}`);

  console.log('4. Logging in buyer...');
  const loginResult = await getAccessToken(userB.address, userB.privateKey, ENV);
  console.log(`   Logged in, userId: ${loginResult.user?.id ?? 'unknown'}`);

  console.log('5. Funding buyer and owner with MockUSDT...');
  await mintUsdt(userB.address, parseUnits('1200', 6), ENV);
  await mintUsdt(admin.address, parseUnits('200', 6), ENV);

  console.log('6. Approving USDT for NFT purchase and subsidy funding...');
  await approveUsdt(userB, manifest.contracts.nftSaleAddress, parseUnits(PURCHASE_PRICE_USDT, 6), ENV);
  await approveUsdt(admin, manifest.contracts.settlementAddress, parseUnits('200', 6), ENV);

  console.log('7. Buying purchased NFT...');
  const purchaseTx = await buyNft(userB, 1, ENV);
  console.log(`   Purchase tx: ${purchaseTx}`);

  console.log('8. Syncing purchased NFT before subsidy epoch publish...');
  const initialPurchaseSync = await syncPurchasedNft(loginResult.accessToken, purchaseTx, ENV);
  console.log(`   Initial purchased sync: ${JSON.stringify(initialPurchaseSync)}`);
  if (initialPurchaseSync.holdingsCreated !== 1) {
    throw new Error(`Expected first purchased sync to create 1 holding, got ${initialPurchaseSync.holdingsCreated}`);
  }

  console.log('9. Publishing subsidy epoch on-chain...');
  const latestBlock = await publicClient.getBlock();
  const claimDeadline = Number(latestBlock.timestamp) + 7 * 24 * 60 * 60;
  const publishTx = await publishSubsidyEpoch(
    admin,
    {
      claimDeadline,
      epochId: SUBSIDY_EPOCH_ID,
      subsidyAmount: parseUnits(SUBSIDY_AMOUNT_USDT, 6),
    },
    ENV,
  );
  console.log(`   Publish tx: ${publishTx}`);

  const publishedEpoch = await getPublishedSubsidyEpoch(SUBSIDY_EPOCH_ID, ENV);
  console.log(`   Published epoch: ${JSON.stringify({
    claimDeadline: publishedEpoch[0].toString(),
    publishedAt: publishedEpoch[1].toString(),
    eligiblePurchasedSupply: publishedEpoch[2].toString(),
    claimedPurchasedSupply: publishedEpoch[3].toString(),
    maxEligibleTokenId: publishedEpoch[4].toString(),
    subsidyAmount: publishedEpoch[5].toString(),
    remainingBudget: publishedEpoch[6].toString(),
    published: publishedEpoch[7],
  })}`);
  if (!publishedEpoch[7]) {
    throw new Error('Expected subsidy epoch to be published on-chain');
  }

  console.log('10. Re-syncing purchased NFT to project subsidy claim...');
  const subsidyProjectionSync = await syncPurchasedNft(loginResult.accessToken, purchaseTx, ENV);
  console.log(`   Projection sync: ${JSON.stringify(subsidyProjectionSync)}`);
  if (subsidyProjectionSync.claimsCreated !== 1) {
    throw new Error(`Expected re-sync to create 1 subsidy claim, got ${subsidyProjectionSync.claimsCreated}`);
  }

  console.log('11. Reading projected subsidy claim from server...');
  const claimsBefore = await getMyClaims(loginResult.accessToken, ENV);
  const pendingClaim = normalizeClaim(claimsBefore);
  console.log(`   Pending claim: ${JSON.stringify(pendingClaim)}`);
  if (pendingClaim.status !== 'PENDING') {
    throw new Error(`Expected subsidy claim status PENDING, got ${pendingClaim.status}`);
  }
  if (pendingClaim.epochNo !== SUBSIDY_EPOCH_ID) {
    throw new Error(`Expected subsidy claim epochNo ${SUBSIDY_EPOCH_ID}, got ${pendingClaim.epochNo}`);
  }

  console.log('12. Claiming subsidy on-chain...');
  const claimTx = await claimSubsidy(userB, pendingClaim.epochNo, pendingClaim.tokenId, ENV);
  await testClient.mine({ blocks: 1 });
  console.log(`   Claim tx: ${claimTx}`);

  const claimedOnChain = await isSubsidyClaimed(pendingClaim.epochNo, pendingClaim.tokenId, ENV);
  if (!claimedOnChain) {
    throw new Error('Expected subsidy claim to be marked claimed on-chain');
  }

  console.log('12b. Verifying duplicate on-chain subsidy claim is rejected...');
  let duplicateClaimRejected = false;
  try {
    await claimSubsidy(userB, pendingClaim.epochNo, pendingClaim.tokenId, ENV);
  } catch (error) {
    duplicateClaimRejected = true;
    console.log(`   Duplicate on-chain subsidy claim rejected: ${error.message}`);
  }
  if (!duplicateClaimRejected) {
    throw new Error('Expected duplicate on-chain subsidy claim to be rejected');
  }

  console.log('13. Syncing subsidy claim back to server...');
  const claimSyncResult = await syncClaim(
    loginResult.accessToken,
    {
      subsidyClaimId: pendingClaim.subsidyClaimId,
      txHash: claimTx,
    },
    ENV,
  );
  console.log(`   Claim sync result: ${JSON.stringify(claimSyncResult)}`);
  if (claimSyncResult.status !== 'CLAIMED') {
    throw new Error(`Expected claim sync status CLAIMED, got ${claimSyncResult.status}`);
  }

  console.log('14. Verifying duplicate claim sync is idempotent...');
  const duplicateSyncResult = await syncClaim(
    loginResult.accessToken,
    {
      subsidyClaimId: pendingClaim.subsidyClaimId,
      txHash: claimTx,
    },
    ENV,
  );
  console.log(`   Duplicate sync result: ${JSON.stringify(duplicateSyncResult)}`);
  if (duplicateSyncResult.txHash?.toLowerCase() !== claimTx.toLowerCase()) {
    throw new Error('Expected duplicate subsidy sync to preserve the original txHash');
  }

  console.log('15. Verifying claim becomes CLAIMED in claims view...');
  const claimsAfter = await getMyClaims(loginResult.accessToken, ENV);
  const claimedClaim = normalizeClaim(claimsAfter);
  console.log(`   Claimed claim: ${JSON.stringify(claimedClaim)}`);
  if (claimedClaim.status !== 'CLAIMED') {
    throw new Error(`Expected subsidy claim status CLAIMED, got ${claimedClaim.status}`);
  }
  if (claimedClaim.txHash?.toLowerCase() !== claimTx.toLowerCase()) {
    throw new Error('Expected claimed subsidy row to persist claim txHash');
  }

  console.log('\n16. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
    stopAnvil: false,
  });

  console.log('\n✅ Subsidy claim flow completed successfully!\n');
  return {
    claimSyncResult,
    claimedClaim,
    success: true,
  };
}

run().catch(async (error) => {
  console.error('\n❌ Subsidy claim flow failed:', error.message);
  console.error(error.stack);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
      stopAnvil: false,
    });
  } catch {}
  process.exit(1);
});

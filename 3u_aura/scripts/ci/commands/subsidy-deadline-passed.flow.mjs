import { loadManifest, loadWalletFixture } from '../lib/manifest.mjs';
import {
  approveUsdt,
  buyNft,
  claimSubsidy,
  createPublicClientForFork,
  createTestClientForFork,
  increaseForkTime,
  mintUsdt,
  parseUnits,
  publishSubsidyEpoch,
} from '../lib/contracts.mjs';
import {
  getAccessToken,
  getMyClaims,
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
  console.log('\n========== Subsidy Deadline Passed Flow Test ==========\n');

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
  await syncPurchasedNft(loginResult.accessToken, purchaseTx, ENV);

  console.log('9. Publishing subsidy epoch with short claim deadline...');
  const latestBlock = await publicClient.getBlock();
  const claimDeadline = Number(latestBlock.timestamp) + 60;
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

  console.log('10. Re-syncing purchased NFT to project subsidy claim...');
  await syncPurchasedNft(loginResult.accessToken, purchaseTx, ENV);

  console.log('11. Reading projected subsidy claim from server...');
  const claimsBefore = await getMyClaims(loginResult.accessToken, ENV);
  const pendingClaim = normalizeClaim(claimsBefore);
  console.log(`   Pending claim: ${JSON.stringify(pendingClaim)}`);

  console.log('12. Advancing fork time beyond subsidy claim deadline...');
  await increaseForkTime(61, ENV);
  await testClient.mine({ blocks: 1 });

  console.log('13. Verifying expired subsidy claim is rejected on-chain...');
  let deadlineRejected = false;
  try {
    await claimSubsidy(userB, pendingClaim.epochNo, pendingClaim.tokenId, ENV);
  } catch (error) {
    deadlineRejected = true;
    console.log(`   Expired subsidy claim rejected as expected: ${error.message}`);
  }

  if (!deadlineRejected) {
    throw new Error('Expected subsidy claim after deadline to be rejected');
  }

  console.log('\n14. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
    stopAnvil: true,
  });

  console.log('\n✅ Subsidy deadline passed flow completed successfully!\n');
}

run().catch(async (error) => {
  console.error('\n❌ Subsidy deadline passed flow failed:', error.message);
  console.error(error.stack);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
      stopAnvil: true,
    });
  } catch {}
  process.exit(1);
});

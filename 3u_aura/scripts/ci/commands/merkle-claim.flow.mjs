import { cleanupHarness } from '../lib/harness.mjs';
import { runWeeklyMerkleClaimFlow } from '../lib/weekly-merkle-claim-flow.mjs';

runWeeklyMerkleClaimFlow({
  claimType: 'MERKLE_RANKING',
  label: 'Weekly Merkle Ranking Claim',
  rewardJsonUri: 'ipfs://ci/weekly-merkle-claim.json',
}).catch(async (error) => {
  console.error('\n❌ Weekly merkle claim flow failed:', error.message);
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

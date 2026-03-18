import { cleanupHarness } from '../lib/harness.mjs';
import { runWeeklyMerkleClaimFlow } from '../lib/weekly-merkle-claim-flow.mjs';

runWeeklyMerkleClaimFlow({
  claimType: 'MERKLE_LOTTERY',
  label: 'Weekly Merkle Lottery Claim',
  rewardJsonUri: 'ipfs://ci/weekly-merkle-lottery-claim.json',
}).catch(async (error) => {
  console.error('\n❌ Weekly merkle lottery claim flow failed:', error.message);
  console.error(error.stack);
  try {
    await cleanupHarness({
      envName: 'fork-anvil',
      stopServices: ['server'],
      stopAnvil: false,
    });
  } catch {}
  process.exit(1);
});

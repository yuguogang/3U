import { loadWalletFixture } from '../lib/manifest.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';

async function run() {
  console.log('\n========== Login Flow Test ==========\n');
  await prepareHarness({
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const userB = loadWalletFixture('userB', ENV);
  console.log(`1. Logging in as ${userB.address}`);
  const auth = await getAccessToken(userB.address, userB.privateKey, ENV);
  const profile = await getMyProfile(auth.accessToken, ENV);
  console.log(`   User id: ${profile.id}`);
  console.log(`   Invite code: ${profile.inviteCode ?? 'n/a'}`);

  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
  });

  console.log('\n✅ Login flow completed successfully!\n');
}

run().catch(async (error) => {
  console.error('\n❌ Login flow failed:', error.message);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
    });
  } catch {}
  process.exit(1);
});

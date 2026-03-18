import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import * as Anvil from '../lib/anvil.mjs';

const ENV = 'fork-anvil';

async function run() {
  console.log('\n========== Referral Inviter Bind Flow Test ==========\n');

  console.log('1. Starting anvil...');
  await Anvil.startAnvil(ENV);

  console.log('2. Resetting DB...');
  await Anvil.resetDb(ENV);

  const userC = loadWalletFixture('userC', ENV);
  const userB = loadWalletFixture('userB', ENV);

  console.log(`3. UserC: ${userC.address}`);
  console.log(`   UserB (inviter): ${userB.address}`);

  // Login as userB first
  console.log('4. Logging in as userB (inviter)...');
  const userBLogin = await getAccessToken(userB.address, userB.privateKey, ENV);
  const userBProfile = await getMyProfile(userBLogin.accessToken, ENV);
  console.log(`   UserB profile: ${JSON.stringify(userBProfile)}`);

  // Login as userC
  console.log('5. Logging in as userC...');
  const userCLogin = await getAccessToken(userC.address, userC.privateKey, ENV);
  const userCProfile = await getMyProfile(userCLogin.accessToken, ENV);
  console.log(`   UserC profile: ${JSON.stringify(userCProfile)}`);

  // Bind inviter via API
  console.log('6. Binding userC to userB as inviter...');
  
  const manifest = loadManifest(ENV);
  const serverUrl = manifest.infra.server.publicApiBaseUrl;
  
  const bindResponse = await fetch(`${serverUrl}/api/v1/referral/inviter/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userCLogin.accessToken}`,
    },
    body: JSON.stringify({
      inviteCode: userBProfile.inviteCode,
    }),
  });

  if (!bindResponse.ok) {
    const error = await bindResponse.text();
    console.log(`   Bind failed: ${error}`);
    throw new Error(`Bind failed: ${error}`);
  }

  const bindResult = await bindResponse.json();
  console.log(`   Bind result: ${JSON.stringify(bindResult)}`);

  // Cleanup
  console.log('\n7. Stopping anvil...');
  await Anvil.stopAnvil(ENV);

  console.log('\n✅ Referral Inviter Bind completed successfully!\n');
  return { success: true };
}

run().catch(async (error) => {
  console.error('\n❌ Error:', error.message);
  try {
    await Anvil.stopAnvil(ENV);
  } catch {}
  process.exit(1);
});

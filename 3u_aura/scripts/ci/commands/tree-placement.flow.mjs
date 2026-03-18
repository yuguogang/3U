import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import * as Anvil from '../lib/anvil.mjs';

const ENV = 'fork-anvil';

async function run() {
  console.log('\n========== Tree Placement Bind Flow Test ==========\n');

  console.log('1. Starting anvil...');
  await Anvil.startAnvil(ENV);

  console.log('2. Resetting DB...');
  await Anvil.resetDb(ENV);

  const userC = loadWalletFixture('userC', ENV);
  const userB = loadWalletFixture('userB', ENV);

  console.log(`3. UserC: ${userC.address}`);
  console.log(`   UserB (inviter): ${userB.address}`);

  // Login as userB first to get inviter in system
  console.log('4. Logging in as userB (inviter)...');
  const userBLogin = await getAccessToken(userB.address, userB.privateKey, ENV);
  const userBProfile = await getMyProfile(userBLogin.accessToken, ENV);
  console.log(`   UserB userId: ${userBProfile.id}`);

  // Login as userC
  console.log('5. Logging in as userC...');
  const userCLogin = await getAccessToken(userC.address, userC.privateKey, ENV);
  const userCProfile = await getMyProfile(userCLogin.accessToken, ENV);
  console.log(`   UserC userId: ${userCProfile.id}`);

  // First bind inviter
  console.log('6. Binding userC to userB as inviter...');
  
  const manifest = loadManifest(ENV);
  const serverUrl = manifest.infra.server.publicApiBaseUrl;
  
  const inviterBindResponse = await fetch(`${serverUrl}/api/v1/referral/inviter/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userCLogin.accessToken}`,
    },
    body: JSON.stringify({
      inviteCode: userBProfile.inviteCode,
    }),
  });

  if (!inviterBindResponse.ok) {
    const error = await inviterBindResponse.text();
    console.log(`   Inviter bind failed: ${error}`);
    throw new Error(`Inviter bind failed: ${error}`);
  }

  const inviterBindResult = await inviterBindResponse.json();
  console.log(`   Inviter bind result: ${JSON.stringify(inviterBindResult)}`);

  // Get selectable slots for inviter
  console.log('7. Getting selectable slots for userB...');
  
  const slotsResponse = await fetch(`${serverUrl}/api/v1/tree/placement/selectable-slots`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userBLogin.accessToken}`,
    },
  });

  const slots = await slotsResponse.json();
  console.log(`   Selectable slots: ${JSON.stringify(slots)}`);

  // Bind placement via API - inviter (userB) does the placement
  console.log('8. Binding userC to userB as placement (by userB)...');
  
  const bindResponse = await fetch(`${serverUrl}/api/v1/tree/placement/bind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userBLogin.accessToken}`,
    },
    body: JSON.stringify({
      placementUserId: userCProfile.id,
      parentId: userBProfile.id,
      teamPosition: 'LEFT',
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

  console.log('\n✅ Tree Placement Bind completed successfully!\n');
  return { success: true };
}

run().catch(async (error) => {
  console.error('\n❌ Error:', error.message);
  try {
    await Anvil.stopAnvil(ENV);
  } catch {}
  process.exit(1);
});

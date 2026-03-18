import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import {
  createWalletClientForFixture,
  createPublicClientForFork,
  createTestClientForFork,
  increaseForkTime,
} from '../lib/contracts.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';

async function setEligibilityInDb(userId, envName, manifest) {
  if (!userId) {
    throw new Error('Expected userId before seeding referral eligibility');
  }

  const { execSync } = await import('node:child_process');
  const { writeFileSync, unlinkSync } = await import('node:fs');
  const schema = manifest.infra.database.schema;
  const databaseName = manifest.infra.database.name;
  const databaseHost = manifest.infra.database.host;
  const databasePort = manifest.infra.database.port;

  const scriptCjs = `
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:password@${databaseHost}:${databasePort}/${databaseName}',
  });

  await pool.query(\`
    INSERT INTO "${schema}"."NftReferralEligibility" (id, "userId", status, "personalCheckinCount", "smallLegVolumeUsdt", "requiredCheckinCount", "requiredSmallLegUsdt", "approvedAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, 'APPROVED', 30, 6000000000, 30, 6000000000, NOW(), NOW(), NOW())
    ON CONFLICT ("userId") DO UPDATE SET
      status = 'APPROVED',
      "personalCheckinCount" = 30,
      "smallLegVolumeUsdt" = 6000000000,
      "approvedAt" = NOW(),
      "updatedAt" = NOW()
  \`, ['${userId}']);

  await pool.query(\`
    INSERT INTO "${schema}"."UserProfile" (
      id, "userId", "totalCheckinDays", "currentStreakDays", "maxStreakDays",
      "totalCheckinCount", "totalCheckinUsdt", "totalAuraFromCheckin",
      "totalAuraFromDirect", "totalAuraFromIndirect", "totalAuraFromConsolation",
      "leftTeamVolume", "rightTeamVolume", "smallLegVolume",
      "hasPurchasedNft", "hasReferralNft", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(), $1, 30, 30, 30, 30, 90000000, 0, 0, 0, 0,
      6000000000, 6000000000, 6000000000, false, false, NOW(), NOW()
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "totalCheckinDays" = 30,
      "currentStreakDays" = 30,
      "maxStreakDays" = 30,
      "totalCheckinCount" = 30,
      "totalCheckinUsdt" = 90000000,
      "smallLegVolume" = 6000000000,
      "leftTeamVolume" = 6000000000,
      "rightTeamVolume" = 6000000000,
      "hasReferralNft" = false,
      "updatedAt" = NOW()
  \`, ['${userId}']);

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  const scriptPath = '/Users/ygg/vs/ai/3U/3u_aura/apps/server/set_expired_referral_eligibility.cjs';
  writeFileSync(scriptPath, scriptCjs);
  try {
    execSync('node set_expired_referral_eligibility.cjs', {
      cwd: '/Users/ygg/vs/ai/3U/3u_aura/apps/server',
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_PATH: '/Users/ygg/vs/ai/3U/3u_aura/apps/server/node_modules',
      },
    });
  } finally {
    try {
      unlinkSync(scriptPath);
    } catch {}
  }
}

async function run() {
  console.log('\n========== Referral Expired Signature Flow Test ==========\n');

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const userC = loadWalletFixture('userC', ENV);
  const manifest = loadManifest(ENV);
  const publicClient = createPublicClientForFork(ENV);
  const walletClient = createWalletClientForFixture(userC, ENV);
  const testClient = createTestClientForFork(ENV);

  console.log(`3. UserC: ${userC.address}`);

  console.log('4. Logging in as userC...');
  const loginResult = await getAccessToken(userC.address, userC.privateKey, ENV);
  const userCProfile = await getMyProfile(loginResult.accessToken, ENV);
  console.log(`   UserC logged in, userId: ${userCProfile.id}`);

  console.log('5. Seeding approved referral eligibility...');
  await setEligibilityInDb(userCProfile.id, ENV, manifest);

  console.log('6. Requesting referral mint signature...');
  const serverUrl = manifest.infra.server.publicApiBaseUrl;
  const signatureResponse = await fetch(`${serverUrl}/api/v1/signing/referral-mint-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginResult.accessToken}`,
    },
    body: JSON.stringify({
      recipient: userC.address,
      chainId: 97,
    }),
  });

  if (!signatureResponse.ok) {
    throw new Error(`Signature request failed: ${await signatureResponse.text()}`);
  }

  const signatureResult = await signatureResponse.json();
  console.log(`   Signature result: ${JSON.stringify(signatureResult)}`);

  const nftSaleAbi = [
    {
      inputs: [
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'signature', type: 'bytes' },
      ],
      name: 'mintNFTByReferral',
      outputs: [{ name: 'tokenId', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  console.log('7. Advancing fork time beyond signature expiry...');
  const latestBlock = await publicClient.getBlock();
  const secondsUntilExpiry = Number(signatureResult.expiry) - Number(latestBlock.timestamp);
  await increaseForkTime(Math.max(secondsUntilExpiry + 1, 1), ENV);
  await testClient.mine({ blocks: 1 });

  console.log('8. Verifying expired signature mint is rejected on-chain...');
  let expiredSignatureRejected = false;
  try {
    await walletClient.writeContract({
      abi: nftSaleAbi,
      address: manifest.contracts.nftSaleAddress,
      args: [
        BigInt(signatureResult.nonce),
        BigInt(signatureResult.expiry),
        signatureResult.signature,
      ],
      functionName: 'mintNFTByReferral',
    });
  } catch (error) {
    expiredSignatureRejected = true;
    console.log(`   Expired signature rejected as expected: ${error.message}`);
  }

  if (!expiredSignatureRejected) {
    throw new Error('Expected expired referral signature mint to fail, but it succeeded');
  }

  console.log('\n9. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
    stopAnvil: true,
  });

  console.log('\n✅ Referral expired signature flow completed successfully!\n');
}

run().catch(async (error) => {
  console.error('\n❌ Referral expired signature flow failed:', error.message);
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

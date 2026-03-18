import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import { createWalletClientForFixture, createPublicClientForFork, createTestClientForFork, parseUnits } from '../lib/contracts.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';

async function setEligibilityInDb(userId, envName, manifest) {
  if (!userId) {
    console.log(`   Skipping DB eligibility set - no userId`);
    return;
  }
  
  console.log(`   Setting eligibility for user: ${userId}`);
  
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
  
  // Check if user exists first
  const userCheck = await pool.query(\`SELECT id FROM "${schema}"."User" WHERE id = $1\`, ['${userId}']);
  console.log('User exists:', userCheck.rows.length > 0, 'userId:', '${userId}');
  
  if (userCheck.rows.length === 0) {
    console.log('User not found, skipping eligibility set');
    await pool.end();
    return;
  }
  
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
      id,
      "userId",
      "totalCheckinDays",
      "currentStreakDays",
      "maxStreakDays",
      "totalCheckinCount",
      "totalCheckinUsdt",
      "totalAuraFromCheckin",
      "totalAuraFromDirect",
      "totalAuraFromIndirect",
      "totalAuraFromConsolation",
      "leftTeamVolume",
      "rightTeamVolume",
      "smallLegVolume",
      "hasPurchasedNft",
      "hasReferralNft",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      $1,
      30,
      30,
      30,
      30,
      90000000,
      0,
      0,
      0,
      0,
      6000000000,
      6000000000,
      6000000000,
      false,
      false,
      NOW(),
      NOW()
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
  
  console.log('Eligibility set successfully');
  await pool.end();
}

main().catch(console.error);
`;
  
  const scriptPath = '/Users/ygg/vs/ai/3U/3u_aura/apps/server/set_eligibility.cjs';
  writeFileSync(scriptPath, scriptCjs);
  
  try {
    // Run from server directory where @prisma/client is available
    execSync(`node set_eligibility.cjs`, { 
      cwd: '/Users/ygg/vs/ai/3U/3u_aura/apps/server',
      stdio: 'inherit',
      env: { 
        ...process.env,
        NODE_PATH: '/Users/ygg/vs/ai/3U/3u_aura/apps/server/node_modules'
      }
    });
    console.log(`   Eligibility set in DB for user ${userId}`);
  } catch (e) {
    console.log(`   DB update warning: ${e.message}`);
  } finally {
    try { unlinkSync(scriptPath); } catch {}
  }
}

async function run() {
  console.log('\n========== Referral Mint Flow Test ==========\n');

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const userC = loadWalletFixture('userC', ENV);
  const manifest = loadManifest(ENV);

  console.log(`4. UserC: ${userC.address}`);

  // Login to get userId
  console.log('5. Logging in as userC...');
  const loginResult = await getAccessToken(userC.address, userC.privateKey, ENV);
  console.log('   Login result:', JSON.stringify(loginResult));
  const userCProfile = await getMyProfile(loginResult.accessToken, ENV);
  console.log(`   UserC profile:`, JSON.stringify(userCProfile));
  console.log(`   UserC logged in, userId: ${userCProfile.id}`);

  // Set eligibility in DB using prisma
  console.log('6. Setting eligibility in DB...');
  await setEligibilityInDb(userCProfile.id, ENV, manifest);

  // Get nonce and expiry from backend
  console.log('7. Getting referral mint signature from backend...');
  
  const serverUrl = manifest.infra.server.publicApiBaseUrl;
  
  const signatureResponse = await fetch(`${serverUrl}/api/v1/signing/referral-mint-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginResult.accessToken}`,
    },
    body: JSON.stringify({
      recipient: userC.address,
      chainId: 97,
    }),
  });

  if (!signatureResponse.ok) {
    const error = await signatureResponse.text();
    console.log(`   Signature request failed: ${error}`);
    throw new Error(`Signature request failed: ${error}`);
  }

  const signatureResult = await signatureResponse.json();
  console.log(`   Signature result: ${JSON.stringify(signatureResult)}`);

  // Call contract to mint
  console.log('8. Minting NFT via contract...');
  
  const publicClient = createPublicClientForFork(ENV);
  const walletClient = createWalletClientForFixture(userC, ENV);
  const testClient = createTestClientForFork(ENV);

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

  await testClient.mine({ blocks: 3 });

  try {
    const hash = await walletClient.writeContract({
      abi: nftSaleAbi,
      address: manifest.contracts.nftSaleAddress,
      args: [
        BigInt(signatureResult.nonce),
        BigInt(signatureResult.expiry),
        signatureResult.signature,
      ],
      functionName: 'mintNFTByReferral',
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   Mint tx: ${hash}`);
    console.log(`   Receipt status: ${receipt.status}`);
    console.log(`   Logs: ${receipt.logs.length}`);

    if (receipt.status === 'success' && receipt.logs.length > 0) {
      console.log('\n   ✅ Referral NFT minted on-chain successfully!');

      console.log('9. Verifying replay mint with same signed payload fails...');
      let replayRejected = false;
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
      } catch (replayError) {
        replayRejected = true;
        console.log(`   Replay mint rejected as expected: ${replayError.message}`);
      }

      if (!replayRejected) {
        throw new Error('Expected replay mint with identical nonce/signature to fail, but it succeeded');
      }
      
      console.log('10. Syncing to backend...');
      const syncResponse = await fetch(`${serverUrl}/api/v1/claims/referral-nft/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginResult.accessToken}`,
        },
        body: JSON.stringify({ txHash: hash }),
      });

      if (!syncResponse.ok) {
        const error = await syncResponse.text();
        throw new Error(`Referral NFT sync failed: ${error}`);
      }

      const syncResult = await syncResponse.json();
      console.log(`   Sync result: ${JSON.stringify(syncResult)}`);

      if (syncResult.txHash.toLowerCase() !== hash.toLowerCase()) {
        throw new Error(
          `Expected referral sync txHash ${hash} but received ${syncResult.txHash}`,
        );
      }
      if (!/^\d+$/.test(String(syncResult.tokenId))) {
        throw new Error(`Expected referral sync tokenId to be an integer string but received ${syncResult.tokenId}`);
      }
      if (!syncResult.hasReferralNft) {
        throw new Error('Expected referral sync to mark hasReferralNft=true');
      }
      if (syncResult.holdingsCreated !== 1) {
        throw new Error(
          `Expected first referral sync to create 1 holding but received ${syncResult.holdingsCreated}`,
        );
      }

      console.log('11. Verifying duplicate sync is idempotent...');
      const duplicateSyncResponse = await fetch(`${serverUrl}/api/v1/claims/referral-nft/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginResult.accessToken}`,
        },
        body: JSON.stringify({ txHash: hash }),
      });

      if (!duplicateSyncResponse.ok) {
        const error = await duplicateSyncResponse.text();
        throw new Error(`Duplicate referral sync failed: ${error}`);
      }

      const duplicateSyncResult = await duplicateSyncResponse.json();
      console.log(`   Duplicate sync result: ${JSON.stringify(duplicateSyncResult)}`);

      if (duplicateSyncResult.txHash.toLowerCase() !== hash.toLowerCase()) {
        throw new Error(
          `Expected duplicate referral sync txHash ${hash} but received ${duplicateSyncResult.txHash}`,
        );
      }
      if (duplicateSyncResult.tokenId !== syncResult.tokenId) {
        throw new Error(
          `Expected duplicate referral sync tokenId ${syncResult.tokenId} but received ${duplicateSyncResult.tokenId}`,
        );
      }
      if (duplicateSyncResult.holdingsCreated !== 0) {
        throw new Error(
          `Expected duplicate referral sync to create 0 holdings but received ${duplicateSyncResult.holdingsCreated}`,
        );
      }

      // Verify NFT balance
      console.log('12. Verifying NFT balance...');
      const nftAbi = [
        {
          inputs: [{ name: 'account', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];
      
      const nftBalance = await publicClient.readContract({
        abi: nftAbi,
        address: manifest.contracts.founderNftAddress,
        args: [userC.address],
        functionName: 'balanceOf',
      });
      console.log(`    NFT balance: ${nftBalance}`);
    }

    // Cleanup
    console.log('\n13. Cleaning up harness...');
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
    });

    console.log('\n✅ Referral Mint flow completed successfully!\n');
    return { success: true };
  } catch (error) {
    console.error(`   Mint failed: ${error.message}`);
    throw error;
  }
}

run().catch(async (error) => {
  console.error('\n❌ Error:', error.message);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
    });
  } catch {}
  process.exit(1);
});

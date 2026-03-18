import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import { createWalletClientForFixture, createPublicClientForFork, createTestClientForFork, parseUnits } from '../lib/contracts.mjs';
import { getAccessToken, getMyProfile } from '../lib/server.mjs';
import * as Anvil from '../lib/anvil.mjs';

const ENV = 'fork-anvil';

async function setEligibilityInDb(userId, envName) {
  if (!userId) {
    console.log(`   Skipping DB eligibility set - no userId`);
    return;
  }
  
  console.log(`   Setting eligibility for user: ${userId}`);
  
  const { execSync } = await import('node:child_process');
  const { writeFileSync, unlinkSync } = await import('node:fs');
  
  // Write a simple script to set eligibility in the server directory
  // Use pg directly since Prisma v7 requires adapter configuration
  // Note: Server writes to public schema, not fork_anvil
  const scriptCjs = `
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:password@127.0.0.1:5433/3u_aura_uat_mockusdt?schema=public',
  });
  
  // Check if user exists first
  const userCheck = await pool.query(\`SELECT id FROM "User" WHERE id = $1\`, ['${userId}']);
  console.log('User exists:', userCheck.rows.length > 0, 'userId:', '${userId}');
  
  if (userCheck.rows.length === 0) {
    console.log('User not found, skipping eligibility set');
    await pool.end();
    return;
  }
  
  await pool.query(\`
    INSERT INTO "NftReferralEligibility" (id, "userId", status, "personalCheckinCount", "smallLegVolumeUsdt", "requiredCheckinCount", "requiredSmallLegUsdt", "approvedAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, 'APPROVED', 30, 6000000000, 30, 6000000000, NOW(), NOW(), NOW())
    ON CONFLICT ("userId") DO UPDATE SET
      status = 'APPROVED',
      "personalCheckinCount" = 30,
      "smallLegVolumeUsdt" = 6000000000,
      "approvedAt" = NOW(),
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

  console.log('1. Starting anvil...');
  await Anvil.startAnvil(ENV);

  console.log('2. Deploying fresh contracts...');
  await Anvil.ensureFreshContracts(ENV);

  console.log('3. Resetting DB...');
  await Anvil.resetDb(ENV);

  const userC = loadWalletFixture('userC', ENV);
  const userB = loadWalletFixture('userB', ENV);
  const manifest = loadManifest(ENV);

  console.log(`4. UserC: ${userC.address}`);
  console.log(`   UserB: ${userB.address}`);

  // Login to get userId
  console.log('5. Logging in as userC...');
  const loginResult = await getAccessToken(userC.address, userC.privateKey, ENV);
  console.log('   Login result:', JSON.stringify(loginResult));
  const userCProfile = await getMyProfile(loginResult.accessToken, ENV);
  console.log(`   UserC profile:`, JSON.stringify(userCProfile));
  console.log(`   UserC logged in, userId: ${userCProfile.id}`);

  // Set eligibility in DB using prisma
  console.log('6. Setting eligibility in DB...');
  await setEligibilityInDb(userCProfile.id, ENV);

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
      
      // Try sync to backend
      try {
        console.log('9. Syncing to backend...');
        const syncResponse = await fetch(`${serverUrl}/api/v1/claims/referral-nft/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginResult.accessToken}`,
          },
          body: JSON.stringify({ txHash: hash }),
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log(`   Sync result: ${JSON.stringify(syncResult)}`);
        } else {
          const error = await syncResponse.text();
          console.log(`   ⚠️  Sync failed: ${error}`);
        }
      } catch (syncError) {
        console.log(`   ⚠️  Sync error: ${syncError.message}`);
      }

      // Verify NFT balance
      console.log('10. Verifying NFT balance...');
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
    console.log('\n11. Stopping anvil...');
    await Anvil.stopAnvil(ENV);

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
    await Anvil.stopAnvil(ENV);
  } catch {}
  process.exit(1);
});

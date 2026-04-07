import { loadManifest, loadWalletFixture } from '../lib/manifest.mjs';
import {
  createPublicClientForFork,
  createTestClientForFork,
  createWalletClientForFixture,
} from '../lib/contracts.mjs';
import {
  getAccessToken,
  getCurrentEligibility,
  getMyProfile,
  giftReferralNft,
  issueReferralMintSignature,
  syncReferralNft,
} from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';

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

const founderNftAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function mintReferralNft({
  fixture,
  signatureResult,
}) {
  const manifest = loadManifest(ENV);
  const publicClient = createPublicClientForFork(ENV);
  const walletClient = createWalletClientForFixture(fixture, ENV);

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
  if (receipt.status !== 'success') {
    throw new Error(`Expected referral mint tx success, got ${receipt.status}`);
  }

  return hash;
}

async function expectReplayRejected({
  fixture,
  signatureResult,
}) {
  const manifest = loadManifest(ENV);
  const walletClient = createWalletClientForFixture(fixture, ENV);

  let rejected = false;
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
    rejected = true;
    console.log(`   Replay mint rejected as expected: ${error.message}`);
  }

  if (!rejected) {
    throw new Error(
      'Expected replay mint with identical nonce/signature to fail, but it succeeded',
    );
  }
}

async function readReferralBalance(address) {
  const manifest = loadManifest(ENV);
  const publicClient = createPublicClientForFork(ENV);

  return publicClient.readContract({
    abi: founderNftAbi,
    address: manifest.contracts.founderNftAddress,
    args: [address],
    functionName: 'balanceOf',
  });
}

async function run() {
  console.log('\n========== Referral Gift + Multi-Mint Flow Test ==========\n');

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const admin = loadWalletFixture('admin', ENV);
  const userC = loadWalletFixture('userC', ENV);
  const testClient = createTestClientForFork(ENV);

  try {
    console.log(`3. Admin: ${admin.address}`);
    console.log(`   Target wallet: ${userC.address}`);

    console.log('4. Logging in admin and target user...');
    const [adminLogin, userLogin] = await Promise.all([
      getAccessToken(admin.address, admin.privateKey, ENV),
      getAccessToken(userC.address, userC.privateKey, ENV),
    ]);
    const userProfile = await getMyProfile(userLogin.accessToken, ENV);
    console.log(`   User profile: ${JSON.stringify(userProfile)}`);

    console.log('5. Verifying initial referral eligibility view...');
    const initialEligibility = await getCurrentEligibility(
      userLogin.accessToken,
      ENV,
    );
    console.log(`   Initial eligibility: ${JSON.stringify(initialEligibility)}`);
    if ((initialEligibility.claimableMintCount ?? 0) !== 0) {
      throw new Error(
        `Expected initial claimableMintCount 0, got ${initialEligibility.claimableMintCount}`,
      );
    }

    console.log('6. Granting first referral NFT via admin gift...');
    const firstGiftResult = await giftReferralNft(
      adminLogin.accessToken,
      userProfile.id,
      ENV,
      'CI first gift flow',
    );
    console.log(`   First gift result: ${JSON.stringify(firstGiftResult)}`);

    const eligibilityAfterFirstGift = await getCurrentEligibility(
      userLogin.accessToken,
      ENV,
    );
    console.log(
      `   Eligibility after first gift: ${JSON.stringify(eligibilityAfterFirstGift)}`,
    );
    if (eligibilityAfterFirstGift.claimableMintCount !== 1) {
      throw new Error(
        `Expected claimableMintCount 1 after first gift, got ${eligibilityAfterFirstGift.claimableMintCount}`,
      );
    }

    console.log('7. Issuing first referral mint signature...');
    const firstSignature = await issueReferralMintSignature(
      userLogin.accessToken,
      userC.address,
      ENV,
    );
    console.log(`   First signature: ${JSON.stringify(firstSignature)}`);

    console.log('8. Minting first referral NFT...');
    const firstMintTx = await mintReferralNft({
      fixture: userC,
      signatureResult: firstSignature,
    });
    console.log(`   First mint tx: ${firstMintTx}`);
    await testClient.mine({ blocks: 1 });

    console.log('9. Syncing first referral NFT...');
    const firstSync = await syncReferralNft(userLogin.accessToken, firstMintTx, ENV);
    console.log(`   First sync result: ${JSON.stringify(firstSync)}`);
    if (firstSync.holdingsCreated !== 1) {
      throw new Error(
        `Expected first sync to create 1 holding, got ${firstSync.holdingsCreated}`,
      );
    }

    console.log('10. Verifying duplicate sync remains idempotent...');
    const duplicateFirstSync = await syncReferralNft(
      userLogin.accessToken,
      firstMintTx,
      ENV,
    );
    console.log(`   Duplicate first sync: ${JSON.stringify(duplicateFirstSync)}`);
    if (duplicateFirstSync.holdingsCreated !== 0) {
      throw new Error(
        `Expected duplicate first sync to create 0 holdings, got ${duplicateFirstSync.holdingsCreated}`,
      );
    }

    console.log('11. Verifying first signed payload cannot be replayed...');
    await expectReplayRejected({
      fixture: userC,
      signatureResult: firstSignature,
    });

    const eligibilityAfterFirstMint = await getCurrentEligibility(
      userLogin.accessToken,
      ENV,
    );
    console.log(
      `   Eligibility after first mint: ${JSON.stringify(eligibilityAfterFirstMint)}`,
    );
    if (eligibilityAfterFirstMint.mintedReferralCount !== 1) {
      throw new Error(
        `Expected mintedReferralCount 1 after first mint, got ${eligibilityAfterFirstMint.mintedReferralCount}`,
      );
    }
    if (eligibilityAfterFirstMint.claimableMintCount !== 0) {
      throw new Error(
        `Expected claimableMintCount 0 after first mint, got ${eligibilityAfterFirstMint.claimableMintCount}`,
      );
    }

    console.log('12. Granting second referral NFT via admin gift...');
    const giftResult = await giftReferralNft(
      adminLogin.accessToken,
      userProfile.id,
      ENV,
      'CI gift flow',
    );
    console.log(`   Gift result: ${JSON.stringify(giftResult)}`);

    const eligibilityAfterGift = await getCurrentEligibility(
      userLogin.accessToken,
      ENV,
    );
    console.log(`   Eligibility after gift: ${JSON.stringify(eligibilityAfterGift)}`);
    if (eligibilityAfterGift.claimableMintCount !== 1) {
      throw new Error(
        `Expected claimableMintCount 1 after gift, got ${eligibilityAfterGift.claimableMintCount}`,
      );
    }
    if (eligibilityAfterGift.mintedReferralCount !== 1) {
      throw new Error(
        `Expected mintedReferralCount to remain 1 after gift, got ${eligibilityAfterGift.mintedReferralCount}`,
      );
    }

    console.log('13. Issuing second referral mint signature...');
    const secondSignature = await issueReferralMintSignature(
      userLogin.accessToken,
      userC.address,
      ENV,
    );
    console.log(`   Second signature: ${JSON.stringify(secondSignature)}`);

    console.log('14. Minting second referral NFT...');
    const secondMintTx = await mintReferralNft({
      fixture: userC,
      signatureResult: secondSignature,
    });
    console.log(`   Second mint tx: ${secondMintTx}`);
    await testClient.mine({ blocks: 1 });

    console.log('15. Syncing second referral NFT...');
    const secondSync = await syncReferralNft(
      userLogin.accessToken,
      secondMintTx,
      ENV,
    );
    console.log(`   Second sync result: ${JSON.stringify(secondSync)}`);
    if (secondSync.holdingsCreated !== 1) {
      throw new Error(
        `Expected second sync to create 1 holding, got ${secondSync.holdingsCreated}`,
      );
    }

    const finalEligibility = await getCurrentEligibility(
      userLogin.accessToken,
      ENV,
    );
    console.log(`   Final eligibility: ${JSON.stringify(finalEligibility)}`);
    if (finalEligibility.mintedReferralCount !== 2) {
      throw new Error(
        `Expected mintedReferralCount 2 after second mint, got ${finalEligibility.mintedReferralCount}`,
      );
    }
    if (finalEligibility.claimableMintCount !== 0) {
      throw new Error(
        `Expected final claimableMintCount 0, got ${finalEligibility.claimableMintCount}`,
      );
    }

    console.log('16. Verifying on-chain referral NFT balance is 2...');
    const nftBalance = await readReferralBalance(userC.address);
    console.log(`   NFT balance: ${nftBalance}`);
    if (nftBalance !== 2n) {
      throw new Error(`Expected referral NFT balance 2, got ${nftBalance}`);
    }

    console.log('\n17. Cleaning up harness...');
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
      stopAnvil: false,
    });

    console.log('\n✅ Referral gift + multi-mint flow completed successfully!\n');
    return { success: true };
  } catch (error) {
    console.error(`   Referral gift + multi-mint flow failed: ${error.message}`);
    throw error;
  }
}

run().catch(async (error) => {
  console.error('\n❌ Referral gift + multi-mint flow failed:', error.message);
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

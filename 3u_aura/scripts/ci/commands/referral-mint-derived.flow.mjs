import { loadManifest, loadWalletFixture } from '../lib/manifest.mjs';
import {
  createPublicClientForFork,
  createWalletClientForFixture,
  createTestClientForFork,
  erc20Abi,
  mintUsdt,
  parseUnits,
} from '../lib/contracts.mjs';
import { apiRequest, getAccessToken, getMyProfile, submitCheckin } from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';
import { propagateDerivedTeamVolume } from '../lib/derived-volume.mjs';

const ENV = 'fork-anvil';
const PERSONAL_CHECKIN_COUNT = 30;
const PERSONAL_CHECKIN_USDT = '3';
const BRANCH_VOLUME_USDT = '6000';

async function bindInviter(accessToken, inviteCode) {
  return apiRequest('/api/v1/referral/inviter/bind', {
    method: 'POST',
    accessToken,
    body: { inviteCode },
    envName: ENV,
  });
}

async function bindPlacement(accessToken, placementUserId, parentId, teamPosition) {
  return apiRequest('/api/v1/tree/placement/bind', {
    method: 'POST',
    accessToken,
    body: { placementUserId, parentId, teamPosition },
    envName: ENV,
  });
}

async function getEligibility(accessToken) {
  return apiRequest('/api/v1/nft-eligibility/current', {
    method: 'GET',
    accessToken,
    envName: ENV,
  });
}

async function approveEligibility(accessToken, userId) {
  return apiRequest('/api/v1/admin/ops/nft-eligibility/approve', {
    method: 'POST',
    accessToken,
    body: {
      decisionReason: 'CI derived referral qualification verification',
      userId,
    },
    envName: ENV,
  });
}

async function signReferralMint(accessToken, recipient) {
  return apiRequest('/api/v1/signing/referral-mint-signature', {
    method: 'POST',
    accessToken,
    body: {
      recipient,
      chainId: 97,
    },
    envName: ENV,
  });
}

async function syncReferralNft(accessToken, txHash) {
  return apiRequest('/api/v1/claims/referral-nft/sync', {
    method: 'POST',
    accessToken,
    body: { txHash },
    envName: ENV,
  });
}

async function transferAndSubmitCheckin({
  accessToken,
  amountUsdt,
  publicClient,
  receiverAddress,
  userFixture,
}) {
  const manifest = loadManifest(ENV);
  const amountAtomic = parseUnits(amountUsdt, 6);
  const walletClient = createWalletClientForFixture(userFixture, ENV);

  const transferTx = await walletClient.writeContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [receiverAddress, amountAtomic],
    functionName: 'transfer',
  });

  await publicClient.waitForTransactionReceipt({ hash: transferTx });
  try {
    await submitCheckin(
      accessToken,
      {
        txHash: transferTx,
        chainId: 97,
        payerAddress: userFixture.address,
        amountAtomic: amountAtomic.toString(),
        tokenSymbol: 'USDT',
      },
      ENV,
    );
  } catch (error) {
    const receipt = await publicClient.getTransactionReceipt({ hash: transferTx });
    console.error('   Derived check-in debug:', JSON.stringify({
      amountAtomic: amountAtomic.toString(),
      payerAddress: userFixture.address,
      paymentTokenAddress: manifest.contracts.paymentTokenAddress,
      receiverAddress: receiverAddress,
      txHash: transferTx,
      txLogAddresses: receipt.logs.map((log) => log.address),
    }));
    throw error;
  }

  return transferTx;
}

async function run() {
  console.log('\n========== Referral Mint Derived Flow Test ==========\n');

  await prepareHarness({
    deployFreshContracts: true,
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  const admin = loadWalletFixture('admin', ENV);
  const userA = loadWalletFixture('userA', ENV);
  const userB = loadWalletFixture('userB', ENV);
  const userC = loadWalletFixture('userC', ENV);
  const manifest = loadManifest(ENV);
  const publicClient = createPublicClientForFork(ENV);
  const testClient = createTestClientForFork(ENV);

  console.log(`3. Target userA: ${userA.address}`);
  console.log(`   Left leg userB: ${userB.address}`);
  console.log(`   Right leg userC: ${userC.address}`);

  console.log('4. Logging in users...');
  const [adminLogin, userALogin, userBLogin, userCLogin] = await Promise.all([
    getAccessToken(admin.address, admin.privateKey, ENV),
    getAccessToken(userA.address, userA.privateKey, ENV),
    getAccessToken(userB.address, userB.privateKey, ENV),
    getAccessToken(userC.address, userC.privateKey, ENV),
  ]);
  const [userAProfile, userBProfile, userCProfile] = await Promise.all([
    getMyProfile(userALogin.accessToken, ENV),
    getMyProfile(userBLogin.accessToken, ENV),
    getMyProfile(userCLogin.accessToken, ENV),
  ]);
  console.log(`   userA userId: ${userAProfile.id}, inviteCode: ${userAProfile.inviteCode}`);
  console.log(`   userB userId: ${userBProfile.id}`);
  console.log(`   userC userId: ${userCProfile.id}`);

  console.log('5. Binding inviter relationships for both branch users...');
  await bindInviter(userBLogin.accessToken, userAProfile.inviteCode);
  await bindInviter(userCLogin.accessToken, userAProfile.inviteCode);

  console.log('6. Binding left/right placements under userA...');
  await bindPlacement(userALogin.accessToken, userBProfile.id, userAProfile.id, 'LEFT');
  await bindPlacement(userALogin.accessToken, userCProfile.id, userAProfile.id, 'RIGHT');

  console.log('7. Funding wallets with MockUSDT...');
  await mintUsdt(userA.address, parseUnits('1000', 6), ENV);

  console.log(`8. Generating ${PERSONAL_CHECKIN_COUNT} real check-ins for userA...`);
  for (let index = 0; index < PERSONAL_CHECKIN_COUNT; index += 1) {
    const txHash = await transferAndSubmitCheckin({
      accessToken: userALogin.accessToken,
      amountUsdt: PERSONAL_CHECKIN_USDT,
      publicClient,
      receiverAddress: manifest.roles.checkinReceiverAddress,
      userFixture: userA,
    });
    if ((index + 1) % 10 === 0 || index === PERSONAL_CHECKIN_COUNT - 1) {
      console.log(`   userA check-ins completed: ${index + 1}/${PERSONAL_CHECKIN_COUNT} (last tx ${txHash})`);
    }
  }

  const profileAfterPersonalCheckins = await getMyProfile(userALogin.accessToken, ENV);
  const derivedDateKey =
    profileAfterPersonalCheckins.profile?.lastCheckinDate?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10);

  console.log('9. Propagating left/right branch volume through volume domain service...');
  const branchAmountAtomic = parseUnits(BRANCH_VOLUME_USDT, 6).toString();
  let leftPropagation;
  let rightPropagation;
  try {
    leftPropagation = await propagateDerivedTeamVolume({
      userId: userBProfile.id,
      amountAtomic: branchAmountAtomic,
      dateKey: derivedDateKey,
      envName: ENV,
    });
    rightPropagation = await propagateDerivedTeamVolume({
      userId: userCProfile.id,
      amountAtomic: branchAmountAtomic,
      dateKey: derivedDateKey,
      envName: ENV,
    });
  } catch (error) {
    console.error(
      '   Derived propagation debug:',
      JSON.stringify({
        branchAmountAtomic,
        dateKey: derivedDateKey,
        leftUserId: userBProfile.id,
        rightUserId: userCProfile.id,
        errorMessage: error instanceof Error ? error.message : String(error),
      }),
    );
    throw error;
  }
  console.log(`   Left branch propagation: ${JSON.stringify(leftPropagation)}`);
  console.log(`   Right branch propagation: ${JSON.stringify(rightPropagation)}`);

  await testClient.mine({ blocks: 2 });

  console.log('10. Verifying derived profile state for userA...');
  const derivedProfile = await getMyProfile(userALogin.accessToken, ENV);
  const totalCheckinCount = derivedProfile.profile?.totalCheckinCount ?? 0;
  const smallLegVolume = derivedProfile.profile?.smallLegVolume ?? '0';
  const leftTeamVolume = derivedProfile.profile?.leftTeamVolume ?? '0';
  const rightTeamVolume = derivedProfile.profile?.rightTeamVolume ?? '0';
  console.log(`   totalCheckinCount=${totalCheckinCount}`);
  console.log(`   leftTeamVolume=${leftTeamVolume}`);
  console.log(`   rightTeamVolume=${rightTeamVolume}`);
  console.log(`   smallLegVolume=${smallLegVolume}`);

  if (totalCheckinCount !== PERSONAL_CHECKIN_COUNT) {
    throw new Error(
      `Expected derived totalCheckinCount ${PERSONAL_CHECKIN_COUNT}, got ${totalCheckinCount}`,
    );
  }
  if (BigInt(String(smallLegVolume)) < parseUnits(BRANCH_VOLUME_USDT, 6)) {
    throw new Error(
      `Expected derived smallLegVolume >= ${parseUnits(BRANCH_VOLUME_USDT, 6)}, got ${smallLegVolume}`,
    );
  }

  console.log('11. Verifying eligibility becomes PENDING_APPROVAL without DB seeding...');
  const eligibilityBeforeApproval = await getEligibility(userALogin.accessToken);
  console.log(`   Eligibility before approval: ${JSON.stringify(eligibilityBeforeApproval)}`);
  if (eligibilityBeforeApproval.status !== 'PENDING_APPROVAL') {
    throw new Error(
      `Expected derived eligibility to be PENDING_APPROVAL, got ${eligibilityBeforeApproval.status}`,
    );
  }
  if (eligibilityBeforeApproval.personalCheckinCount !== PERSONAL_CHECKIN_COUNT) {
    throw new Error(
      `Expected eligibility personalCheckinCount ${PERSONAL_CHECKIN_COUNT}, got ${eligibilityBeforeApproval.personalCheckinCount}`,
    );
  }
  if (BigInt(eligibilityBeforeApproval.smallLegVolumeUsdt) < parseUnits(BRANCH_VOLUME_USDT, 6)) {
    throw new Error(
      `Expected eligibility smallLegVolumeUsdt >= ${parseUnits(BRANCH_VOLUME_USDT, 6)}, got ${eligibilityBeforeApproval.smallLegVolumeUsdt}`,
    );
  }

  console.log('12. Approving referral eligibility as admin...');
  const approvalResult = await approveEligibility(adminLogin.accessToken, userAProfile.id);
  console.log(`   Approval result: ${JSON.stringify(approvalResult)}`);
  if (approvalResult.result?.status !== 'APPROVED') {
    throw new Error(`Expected approval result status APPROVED, got ${approvalResult.result?.status}`);
  }

  console.log('13. Getting referral mint signature...');
  const signatureResult = await signReferralMint(userALogin.accessToken, userA.address);
  console.log(`   Signature result: ${JSON.stringify(signatureResult)}`);

  console.log('14. Minting referral NFT on-chain...');
  const walletClient = createWalletClientForFixture(userA, ENV);
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

  const mintTxHash = await walletClient.writeContract({
    abi: nftSaleAbi,
    address: manifest.contracts.nftSaleAddress,
    args: [
      BigInt(signatureResult.nonce),
      BigInt(signatureResult.expiry),
      signatureResult.signature,
    ],
    functionName: 'mintNFTByReferral',
  });
  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
  console.log(`   Mint tx: ${mintTxHash}, status=${mintReceipt.status}`);
  if (mintReceipt.status !== 'success') {
    throw new Error(`Expected derived referral mint success, got ${mintReceipt.status}`);
  }

  console.log('15. Syncing minted referral NFT back to server...');
  const syncResult = await syncReferralNft(userALogin.accessToken, mintTxHash);
  console.log(`   Sync result: ${JSON.stringify(syncResult)}`);
  if (!syncResult.hasReferralNft || syncResult.status !== 'MINTED') {
    throw new Error(`Expected derived referral sync to return hasReferralNft=true and MINTED, got ${JSON.stringify(syncResult)}`);
  }

  console.log('16. Verifying eligibility becomes MINTED after sync...');
  const eligibilityAfterSync = await getEligibility(userALogin.accessToken);
  console.log(`   Eligibility after sync: ${JSON.stringify(eligibilityAfterSync)}`);
  if (eligibilityAfterSync.status !== 'MINTED') {
    throw new Error(
      `Expected derived eligibility to become MINTED after sync, got ${eligibilityAfterSync.status}`,
    );
  }

  console.log('\n17. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
  });

  console.log('\n✅ Referral Mint derived flow completed successfully!\n');
  return { success: true };
}

run().catch(async (error) => {
  console.error('\n❌ Derived referral flow failed:', error.message);
  console.error(error.stack);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
    });
  } catch {}
  process.exit(1);
});

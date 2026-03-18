import { loadWalletFixture } from '../lib/manifest.mjs';
import { createWalletClientForFixture, createPublicClientForFork, mintUsdt, parseUnits, erc20Abi } from '../lib/contracts.mjs';
import { getAccessToken } from '../lib/server.mjs';
import { cleanupHarness, prepareHarness } from '../lib/harness.mjs';

const ENV = 'fork-anvil';

async function run() {
  console.log('\n========== Check-in Flow Test ==========\n');

  await prepareHarness({
    envName: ENV,
    resetDb: true,
    startServices: ['server'],
  });

  // Get wallets
  const userB = loadWalletFixture('userB', ENV);

  console.log(`3. User: ${userB.address}`);

  // Mint USDT to userB for check-in
  console.log('4. Minting USDT to userB...');
  await mintUsdt(userB.address, parseUnits('100', 6), ENV);

  // Transfer USDT to check-in receiver (simulating check-in payment)
  console.log('5. Transferring check-in payment...');
  const manifest = (await import('../lib/manifest.mjs')).loadManifest(ENV);
  
  const walletClient = createWalletClientForFixture(userB, ENV);
  const publicClient = createPublicClientForFork(ENV);

  const transferTx = await walletClient.writeContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [manifest.roles.checkinReceiverAddress, parseUnits('3', 6)],
    functionName: 'transfer',
  });

  await publicClient.waitForTransactionReceipt({ hash: transferTx });
  console.log(`   Transfer tx: ${transferTx}`);

  // Login to get access token
  console.log('6. Logging in...');
  // Get access token - this will fetch the message from server and sign it
  const loginResult = await getAccessToken(userB.address, userB.privateKey, ENV);
  console.log(`   Logged in, userId: ${loginResult.user?.id ?? 'unknown'}`);

  // Submit check-in via API
  console.log('7. Submitting check-in via API...');
  const { submitCheckin } = await import('../lib/server.mjs');
  const checkinResult = await submitCheckin(
    loginResult.accessToken,
    {
      txHash: transferTx,
      chainId: 97,
      payerAddress: userB.address,
      amountAtomic: parseUnits('3', 6).toString(),
      tokenSymbol: 'USDT',
    },
    ENV,
  );
  console.log(`   Check-in submitted: ${JSON.stringify(checkinResult)}`);

  console.log('8. Verifying duplicate check-in handling...');
  let duplicateOutcome = 'unknown';
  try {
    const duplicateResult = await submitCheckin(
      loginResult.accessToken,
      {
        txHash: transferTx,
        chainId: 97,
        payerAddress: userB.address,
        amountAtomic: parseUnits('3', 6).toString(),
        tokenSymbol: 'USDT',
      },
      ENV,
    );
    duplicateOutcome = `idempotent-success:${JSON.stringify(duplicateResult)}`;
    console.log(`   Duplicate check-in returned success: ${JSON.stringify(duplicateResult)}`);
  } catch (error) {
    duplicateOutcome = `rejected:${error.message}`;
    console.log(`   Duplicate check-in rejected as expected: ${error.message}`);
  }

  // Verify via API
  console.log('9. Verifying check-in...');
  const { getMyProfile } = await import('../lib/server.mjs');
  const profile = await getMyProfile(loginResult.accessToken, ENV);
  console.log(`   Profile checkin count: ${profile.profile?.totalCheckinCount ?? 0}`);
  console.log(`   Profile checkin USDT: ${profile.profile?.totalCheckinUsdt ?? '0'}`);

  if ((profile.profile?.totalCheckinCount ?? 0) !== 1) {
    throw new Error(
      `Expected totalCheckinCount to remain 1 after duplicate handling, got ${profile.profile?.totalCheckinCount ?? 0} (duplicateOutcome=${duplicateOutcome})`,
    );
  }

  // Cleanup
  console.log('\n10. Cleaning up harness...');
  await cleanupHarness({
    envName: ENV,
    stopServices: ['server'],
  });

  console.log('\n✅ Check-in flow completed successfully!\n');
  return { success: true, checkinResult, profile };
}

run().catch(async (error) => {
  console.error('\n❌ Check-in flow failed:', error.message);
  console.error(error.stack);
  try {
    await cleanupHarness({
      envName: ENV,
      stopServices: ['server'],
    });
  } catch {}
  process.exit(1);
});

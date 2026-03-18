import { loadWalletFixture } from '../lib/manifest.mjs';
import { createWalletClientForFixture, createPublicClientForFork, mintUsdt, parseUnits, erc20Abi } from '../lib/contracts.mjs';
import { login, getAccessToken } from '../lib/server.mjs';
import * as Anvil from '../lib/anvil.mjs';
import { privateKeyToAccount } from 'viem/accounts';

const ENV = 'fork-anvil';

async function signLoginMessage(address, privateKey) {
  const account = privateKeyToAccount(privateKey);
  const message = `Login to 3U AURA\n${address}`;
  // Use the account's signMessage method directly
  return account.signMessage({ message });
}

async function run() {
  console.log('\n========== Check-in Flow Test ==========\n');

  // Setup: start anvil + reset DB
  console.log('1. Starting anvil...');
  await Anvil.startAnvil(ENV);
  
  console.log('2. Resetting DB...');
  await Anvil.resetDb(ENV);

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

  // Verify via API
  console.log('8. Verifying check-in...');
  const { getMyProfile } = await import('../lib/server.mjs');
  const profile = await getMyProfile(loginResult.accessToken, ENV);
  console.log(`   Profile checkin count: ${profile.profile?.totalCheckinCount ?? 0}`);
  console.log(`   Profile checkin USDT: ${profile.profile?.totalCheckinUsdt ?? '0'}`);

  // Cleanup
  console.log('\n9. Stopping anvil...');
  await Anvil.stopAnvil(ENV);

  console.log('\n✅ Check-in flow completed successfully!\n');
  return { success: true, checkinResult, profile };
}

run().catch(async (error) => {
  console.error('\n❌ Check-in flow failed:', error.message);
  console.error(error.stack);
  try {
    await Anvil.stopAnvil(ENV);
  } catch {}
  process.exit(1);
});

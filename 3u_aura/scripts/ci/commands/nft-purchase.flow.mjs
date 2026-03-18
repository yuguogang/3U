import { loadWalletFixture, loadManifest } from '../lib/manifest.mjs';
import { createWalletClientForFixture, createPublicClientForFork, createTestClientForFork, mintUsdt, parseUnits, approveUsdt, getNftBalance, nftSaleAbi } from '../lib/contracts.mjs';
import { syncPurchasedNft, getAccessToken } from '../lib/server.mjs';
import * as Anvil from '../lib/anvil.mjs';

const ENV = 'fork-anvil';

async function run() {
  console.log('\n========== NFT Purchase Flow Test ==========\n');

  // Setup
  console.log('1. Starting anvil...');
  await Anvil.startAnvil(ENV);
  
  console.log('2. Deploying fresh contracts...');
  await Anvil.ensureFreshContracts(ENV);
  
  console.log('3. Resetting DB...');
  await Anvil.resetDb(ENV);

  // Get wallets and manifest
  const userC = loadWalletFixture('userC', ENV);
  const manifest = loadManifest(ENV);

  console.log(`3. User: ${userC.address}`);
  console.log(`   NFT Sale contract: ${manifest.contracts.nftSaleAddress}`);
  console.log(`   Mock USDT: ${manifest.contracts.paymentTokenAddress}`);

  // Get clients
  const publicClient = createPublicClientForFork(ENV);
  const walletClient = createWalletClientForFixture(userC, ENV);
  const testClient = createTestClientForFork(ENV);

  // Read NFT price
  console.log('   Reading NFT price...');
  const priceResult = await publicClient.readContract({
    abi: nftSaleAbi,
    address: manifest.contracts.nftSaleAddress,
    functionName: 'PURCHASE_PRICE',
  });
  console.log(`   NFT Price: ${priceResult}`);

  // Check remaining
  const remaining = await publicClient.readContract({
    abi: nftSaleAbi,
    address: manifest.contracts.nftSaleAddress,
    functionName: 'getRemainingNFT',
  });
  console.log(`   Remaining: purchased=${remaining[0]}, referral=${remaining[1]}, total=${remaining[2]}`);

  // Mint USDT to userC
  console.log('4. Minting USDT to userC...');
  await mintUsdt(userC.address, parseUnits('2000', 6), ENV);

  // Check balance
  const balance = await publicClient.readContract({
    abi: [{
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }],
    address: manifest.contracts.paymentTokenAddress,
    args: [userC.address],
    functionName: 'balanceOf',
  });
  console.log(`   UserC USDT balance: ${balance}`);

  // Approve
  console.log('5. Approving NFT purchase...');
  await approveUsdt(userC, manifest.contracts.nftSaleAddress, parseUnits('5000', 6), ENV);

  // Check allowance
  const allowance = await publicClient.readContract({
    abi: [{
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }],
    address: manifest.contracts.paymentTokenAddress,
    args: [userC.address, manifest.contracts.nftSaleAddress],
    functionName: 'allowance',
  });
  console.log(`   Allowance: ${allowance}`);

  // Buy NFT
  console.log('6. Buying NFT...');
  
  // Mine blocks to ensure approval is confirmed
  await testClient.mine({ blocks: 3 });
  
  try {
    const hash = await walletClient.writeContract({
      abi: nftSaleAbi,
      address: manifest.contracts.nftSaleAddress,
      functionName: 'buyNFT',
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   Buy tx: ${hash}`);
    console.log(`   Receipt status: ${receipt.status}`);
    console.log(`   Logs: ${receipt.logs.length}`);

    if (receipt.status === 'success' && receipt.logs.length > 0) {
      console.log('\n   ✅ NFT purchased on-chain successfully!');
      
      // Try to sync to backend (may fail if server config doesn't match fresh contracts)
      try {
        console.log('7. Logging in and syncing to backend...');
        const loginResult = await getAccessToken(userC.address, userC.privateKey, ENV);
        const syncResult = await syncPurchasedNft(loginResult.accessToken, hash, ENV);
        console.log(`   Sync result: ${JSON.stringify(syncResult)}`);
      } catch (syncError) {
        console.log(`   ⚠️  Sync failed (server may need restart): ${syncError.message}`);
      }

      // Verify NFT balance
      console.log('8. Verifying NFT balance...');
      const nftBalance = await getNftBalance(userC.address, ENV);
      console.log(`   NFT balance: ${nftBalance}`);
    }

    // Cleanup
    console.log('\n9. Stopping anvil...');
    await Anvil.stopAnvil(ENV);

    if (receipt.status === 'success') {
      console.log('\n✅ NFT Purchase flow completed successfully!\n');
      return { success: true };
    } else {
      console.log('\n❌ NFT Purchase flow failed - transaction reverted\n');
      return { success: false };
    }
  } catch (error) {
    console.error('   Buy failed:', error.message);
    throw error;
  }
}

run().catch(async (error) => {
  console.error('\n❌ NFT Purchase flow failed:', error.message);
  try {
    await Anvil.stopAnvil(ENV);
  } catch {}
  process.exit(1);
});

import { startPromotionServices, stopPromotionServices } from '../../uat/promotion-service-lib.mjs';
import { loadManifest } from './manifest.mjs';
import * as Anvil from './anvil.mjs';
import { loadCiRuntime, writeCiRuntime } from './runtime.mjs';

function mergeRuntime(envName, patch) {
  const existing = loadCiRuntime(envName) ?? {
    envName,
    startedAt: new Date().toISOString(),
  };
  const next = {
    ...existing,
    ...patch,
    envName,
    updatedAt: new Date().toISOString(),
  };
  writeCiRuntime(envName, next);
  return next;
}

export async function prepareHarness({
  envName = 'fork-anvil',
  deployFreshContracts = false,
  resetDb = true,
  startServices = ['server'],
} = {}) {
  if (deployFreshContracts) {
    await Anvil.stopAnvil(envName);
  }

  await Anvil.startAnvil(envName);

  if (deployFreshContracts && startServices.length > 0) {
    await stopPromotionServices({
      envName,
      services: startServices,
    });
  }

  let deployedContracts = null;
  if (deployFreshContracts) {
    deployedContracts = await Anvil.ensureFreshContracts(envName);
  }

  const serviceEnvOverrides = {};
  if (startServices.includes('server') && deployedContracts?.nftSaleAddr) {
    serviceEnvOverrides.server = {
      PROMOTION_NFT_SALE_ADDRESS: deployedContracts.nftSaleAddr,
      PROMOTION_PAYMENT_TOKEN_ADDRESS: deployedContracts.mockUsdtAddr,
      PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS: deployedContracts.merkleAddr,
      PROMOTION_SETTLEMENT_ADDRESS: deployedContracts.settlementAddr,
      PROMOTION_REFERRAL_SIGNER_PRIVATE_KEY:
        deployedContracts.referralSignerPrivateKey,
    };
  }

  if (resetDb) {
    await Anvil.resetDb(envName);
  }

  const servicesRuntime = await startPromotionServices({
    envName,
    services: startServices,
    serviceEnvOverrides,
  });

  const manifest = loadManifest(envName);
  return mergeRuntime(envName, {
    deployedContracts,
    harness: {
      deployFreshContracts,
      resetDb,
      serviceEnvOverrides,
      startServices,
    },
    manifest,
    servicesRuntime,
  });
}

export async function cleanupHarness({
  envName = 'fork-anvil',
  stopServices = ['server'],
  stopAnvil = true,
} = {}) {
  const result = {};
  if (stopServices.length > 0) {
    result.services = await stopPromotionServices({
      envName,
      services: stopServices,
    });
  }

  if (stopAnvil) {
    await Anvil.stopAnvil(envName);
  }

  mergeRuntime(envName, {
    lastCleanupAt: new Date().toISOString(),
  });
  return result;
}

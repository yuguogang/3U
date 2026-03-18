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
  await Anvil.startAnvil(envName);

  let deployedContracts = null;
  if (deployFreshContracts) {
    deployedContracts = await Anvil.ensureFreshContracts(envName);
  }

  if (resetDb) {
    await Anvil.resetDb(envName);
  }

  const servicesRuntime = await startPromotionServices({
    envName,
    services: startServices,
  });

  const manifest = loadManifest(envName);
  return mergeRuntime(envName, {
    deployedContracts,
    harness: {
      deployFreshContracts,
      resetDb,
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

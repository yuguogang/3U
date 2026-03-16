#!/usr/bin/env node

import { stopPromotionServices } from './promotion-service-lib.mjs';

function parseArgs(argv) {
  let envName;
  let services;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--env') {
      envName = argv[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith('--env=')) {
      envName = value.slice('--env='.length);
      continue;
    }
    if (value === '--services') {
      services = argv[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith('--services=')) {
      services = value.slice('--services='.length);
    }
  }

  if (!envName) {
    throw new Error('Missing --env <environment>');
  }

  return {
    envName,
    services: services ? services.split(',').map((value) => value.trim()).filter(Boolean) : undefined,
  };
}

const args = parseArgs(process.argv.slice(2));
const result = await stopPromotionServices(args);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

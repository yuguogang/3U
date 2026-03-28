#!/usr/bin/env node

import { buildTargetContext, formatEnvFile, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.target) {
  throw new Error('Missing --target <contracts|server|dapp|admin>');
}

const context = buildTargetContext({
  cwd: process.cwd(),
  envName: args.envName,
  strict: args.strict,
  target: args.target,
});

process.stdout.write(
  formatEnvFile({
    ...context.derivedEnv,
    ...context.localOverrideEnv,
    ...context.runtimeEnv,
  }),
);

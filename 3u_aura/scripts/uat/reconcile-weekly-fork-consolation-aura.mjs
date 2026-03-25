#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { REPO_ROOT } from '../promotion-env/lib.mjs';

function readArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

const envName = readArg('env') ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
const walletAddress = readArg('wallet');
const userId = readArg('user-id');
const epochId = readArg('epoch-id');

if (!walletAddress && !userId && !epochId) {
  throw new Error(
    'Usage: node scripts/uat/reconcile-weekly-fork-consolation-aura.mjs --env <env> [--wallet <address>] [--user-id <id>] [--epoch-id <id>]',
  );
}

const args = [
  path.join(REPO_ROOT, 'scripts', 'promotion-env', 'run-with-env.mjs'),
  '--target',
  'server',
  '--env',
  envName,
  '--',
  'pnpm',
  '--dir',
  'apps/server',
  'exec',
  'tsx',
  '--tsconfig',
  'tsconfig.json',
  '--no-cache',
  'scripts/reconcile-consolation-aura.ts',
];

if (walletAddress) {
  args.push('--wallet', walletAddress);
}
if (userId) {
  args.push('--user-id', userId);
}
if (epochId) {
  args.push('--epoch-id', epochId);
}

const result = spawnSync(process.execPath, args, {
  cwd: REPO_ROOT,
  encoding: 'utf8',
});

if (result.status !== 0) {
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  throw new Error(
    `Failed to reconcile consolation aura state${
      output ? `:\n${output}` : ''
    }`,
  );
}

process.stdout.write(result.stdout);

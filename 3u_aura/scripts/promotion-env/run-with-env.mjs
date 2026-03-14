#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { REPO_ROOT, buildTargetContext, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));

if (!args.target) {
  throw new Error('Missing --target <contracts|server|dapp|admin>');
}

if (args.command.length === 0) {
  throw new Error('Missing command after --');
}

const context = buildTargetContext({
  cwd: process.cwd(),
  envName: args.envName,
  strict: true,
  target: args.target,
});

function ensureServerPrismaRuntimeLink() {
  if (args.target !== 'server') {
    return;
  }

  const serverRoot = path.join(REPO_ROOT, 'apps', 'server');
  const generatedDir = path.join(serverRoot, 'generated');
  if (!fs.existsSync(generatedDir)) {
    return;
  }

  const distDir = path.join(serverRoot, 'dist');
  const distGeneratedDir = path.join(distDir, 'generated');
  fs.mkdirSync(distDir, { recursive: true });

  if (!fs.existsSync(distGeneratedDir)) {
    fs.symlinkSync(path.relative(distDir, generatedDir), distGeneratedDir, 'dir');
    return;
  }

  const stat = fs.lstatSync(distGeneratedDir);
  if (!stat.isSymbolicLink()) {
    throw new Error(
      `Expected ${distGeneratedDir} to be a symlink to ${generatedDir}, but found a regular path.`,
    );
  }

  const existingTarget = path.resolve(distDir, fs.readlinkSync(distGeneratedDir));
  if (existingTarget !== generatedDir) {
    fs.unlinkSync(distGeneratedDir);
    fs.symlinkSync(path.relative(distDir, generatedDir), distGeneratedDir, 'dir');
  }
}

ensureServerPrismaRuntimeLink();

const child = spawn(args.command[0], args.command.slice(1), {
  cwd: process.cwd(),
  env: context.env,
  shell: false,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

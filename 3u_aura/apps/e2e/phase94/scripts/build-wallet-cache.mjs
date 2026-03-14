#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const FILE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(FILE_DIR, "..");
const SETUP_DIR = path.join(PROJECT_ROOT, "wallet-setup");
const STAGING_ROOT = path.join(PROJECT_ROOT, ".synpress-staging");

function resolveWalletSetupFiles() {
  return fs
    .readdirSync(SETUP_DIR)
    .filter((entry) => entry.endsWith(".setup.ts"))
    .sort();
}

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildSingleWalletCache(setupFile) {
  const setupName = setupFile.replace(/\.setup\.ts$/, "");
  const stagingDir = path.join(STAGING_ROOT, setupName);
  const relativeStagingDir = path.relative(PROJECT_ROOT, stagingDir);

  ensureCleanDir(stagingDir);
  fs.copyFileSync(
    path.join(SETUP_DIR, setupFile),
    path.join(stagingDir, setupFile),
  );

  process.stdout.write(`\n[wallet-cache] building ${setupFile}\n`);
  execFileSync("pnpm", ["exec", "synpress", relativeStagingDir, "-f"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      TMPDIR: process.env.TMPDIR || os.tmpdir(),
    },
  });
}

function main() {
  const setupFiles = resolveWalletSetupFiles();
  ensureCleanDir(STAGING_ROOT);

  for (const setupFile of setupFiles) {
    buildSingleWalletCache(setupFile);
  }

  fs.rmSync(STAGING_ROOT, { recursive: true, force: true });
}

main();

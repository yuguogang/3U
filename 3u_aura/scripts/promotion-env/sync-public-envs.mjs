#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import {
  REPO_ROOT,
  buildTargetContext,
  formatEnvFile,
  writeFileIfChanged,
} from './lib.mjs';

const TARGETS = ['contracts', 'server', 'dapp', 'admin'];

const ENVIRONMENTS = fs
  .readdirSync(path.join(REPO_ROOT, 'config', 'promotion-envs'), {
    withFileTypes: true,
  })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      fs.existsSync(
        path.join(
          REPO_ROOT,
          'config',
          'promotion-envs',
          entry.name,
          'manifest.json',
        ),
      ),
  )
  .map((entry) => entry.name)
  .sort();

for (const envName of ENVIRONMENTS) {
  const envDir = path.join(REPO_ROOT, 'config', 'promotion-envs', envName);

  for (const target of TARGETS) {
    const context = buildTargetContext({
      cwd: REPO_ROOT,
      envName,
      strict: false,
      target,
    });
    const filePath = path.join(envDir, `${target}.public.env`);
    const changed = writeFileIfChanged(filePath, formatEnvFile(context.derivedEnv));
    const status = changed ? 'updated' : 'unchanged';
    process.stdout.write(`${status} ${filePath}\n`);
  }
}

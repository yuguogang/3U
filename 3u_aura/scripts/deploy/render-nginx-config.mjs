#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const templatePath = path.join(repoRoot, 'ops', 'nginx', 'testnet-mockusdt.conf.template');

function parseArgs(argv) {
  const args = {
    apiDomain: '',
    appDomain: '',
    adminDomain: '',
    output: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--api-domain') args.apiDomain = argv[++index];
    else if (value === '--app-domain') args.appDomain = argv[++index];
    else if (value === '--admin-domain') args.adminDomain = argv[++index];
    else if (value === '--output') args.output = argv[++index];
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.apiDomain || !args.appDomain || !args.adminDomain) {
  throw new Error('Missing --api-domain / --app-domain / --admin-domain');
}

const rendered = fs
  .readFileSync(templatePath, 'utf8')
  .replaceAll('__API_DOMAIN__', args.apiDomain)
  .replaceAll('__APP_DOMAIN__', args.appDomain)
  .replaceAll('__ADMIN_DOMAIN__', args.adminDomain);

if (args.output) {
  fs.writeFileSync(args.output, rendered, 'utf8');
} else {
  process.stdout.write(rendered);
}

#!/usr/bin/env node

import {
  parseWeeklyForkArgs,
  prepareWeeklyForkDatabase,
} from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const result = await prepareWeeklyForkDatabase(options);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

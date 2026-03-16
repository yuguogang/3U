#!/usr/bin/env node

import {
  parseWeeklyForkArgs,
  resetWeeklyForkDatabase,
} from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const result = await resetWeeklyForkDatabase(options);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

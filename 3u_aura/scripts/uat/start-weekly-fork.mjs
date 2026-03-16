#!/usr/bin/env node

import { parseWeeklyForkArgs, startWeeklyFork } from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const result = await startWeeklyFork(options);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

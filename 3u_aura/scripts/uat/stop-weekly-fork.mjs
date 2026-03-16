#!/usr/bin/env node

import { parseWeeklyForkArgs, stopWeeklyFork } from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const result = await stopWeeklyFork(options.envName);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

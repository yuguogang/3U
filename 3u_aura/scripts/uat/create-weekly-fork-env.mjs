#!/usr/bin/env node

import { createWeeklyForkEnvironment, parseWeeklyForkArgs } from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const result = createWeeklyForkEnvironment(options);

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

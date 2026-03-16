#!/usr/bin/env node

import {
  increaseWeeklyForkTime,
  parseWeeklyForkArgs,
} from './weekly-fork-lib.mjs';

function readSeconds(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const nextValue = argv[index + 1];

    if (value === '--seconds') {
      return Number(nextValue);
    }

    if (value.startsWith('--seconds=')) {
      return Number(value.slice('--seconds='.length));
    }
  }

  return undefined;
}

const argv = process.argv.slice(2);
const options = parseWeeklyForkArgs(argv);
const seconds = readSeconds(argv);

if (!Number.isFinite(seconds) || seconds <= 0) {
  throw new Error('Missing --seconds <positive-number>');
}

const result = await increaseWeeklyForkTime({
  envName: options.envName,
  seconds,
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

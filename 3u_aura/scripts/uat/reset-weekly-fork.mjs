#!/usr/bin/env node

import {
  parseWeeklyForkArgs,
  startWeeklyFork,
  stopWeeklyFork,
} from './weekly-fork-lib.mjs';

const options = parseWeeklyForkArgs(process.argv.slice(2));
const stopped = await stopWeeklyFork(options.envName);
const started = await startWeeklyFork(options);

process.stdout.write(
  `${JSON.stringify(
    {
      started,
      stopped,
    },
    null,
    2,
  )}\n`,
);

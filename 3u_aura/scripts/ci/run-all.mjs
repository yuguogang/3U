const GROUPS = {
  payment: ['checkin', 'nft-purchase'],
  topology: ['login', 'inviter-bind', 'tree-placement'],
  referral: ['referral-approval', 'referral-derived'],
  claims: ['subsidy-claim'],
  weekly: ['merkle-claim', 'merkle-lottery-claim'],
};

async function execFlow(flow) {
  const { spawn } = await import('node:child_process');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [new URL('./run.mjs', import.meta.url).pathname, flow], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Flow ${flow} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    console.log('Usage: pnpm run all [--no-reset]');
    console.log(`Groups: ${Object.keys(GROUPS).join(', ')}`);
    return;
  }

  const noReset = args.has('--no-reset');
  if (noReset) {
    console.log('Running in --no-reset mode; flows remain individually responsible for reset semantics.');
  }

  for (const [groupName, flows] of Object.entries(GROUPS)) {
    console.log(`\n=== Running group: ${groupName} ===`);
    for (const flow of flows) {
      await execFlow(flow);
    }
  }
}

await main();

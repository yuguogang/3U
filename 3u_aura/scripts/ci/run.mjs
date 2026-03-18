const FLOW_ALIASES = new Map([
  ['checkin', 'checkin.flow.mjs'],
  ['login', 'login.flow.mjs'],
  ['inviter-bind', 'referral-inviter-bind.flow.mjs'],
  ['referral-inviter-bind', 'referral-inviter-bind.flow.mjs'],
  ['tree-placement', 'tree-placement.flow.mjs'],
  ['nft-purchase', 'nft-purchase.flow.mjs'],
  ['subsidy-claim', 'subsidy-claim.flow.mjs'],
  ['merkle-claim', 'merkle-claim.flow.mjs'],
  ['merkle-ranking-claim', 'merkle-claim.flow.mjs'],
  ['merkle-lottery-claim', 'merkle-lottery-claim.flow.mjs'],
  ['referral-approval', 'referral-mint.flow.mjs'],
  ['referral-expired-signature', 'referral-expired-signature.flow.mjs'],
  ['referral-mint', 'referral-mint.flow.mjs'],
  ['referral-derived', 'referral-mint-derived.flow.mjs'],
  ['referral-mint-derived', 'referral-mint-derived.flow.mjs'],
]);

function printUsage() {
  console.log('Usage: pnpm run run -- <flow>');
  console.log(`Available flows: ${[...FLOW_ALIASES.keys()].join(', ')}`);
}

async function main() {
  const flowName = process.argv[2];
  if (!flowName || flowName === '--help' || flowName === '-h') {
    printUsage();
    process.exit(flowName ? 0 : 1);
  }

  const target = FLOW_ALIASES.get(flowName);
  if (!target) {
    console.error(`Unknown flow "${flowName}"`);
    printUsage();
    process.exit(1);
  }

  await import(new URL(`./commands/${target}`, import.meta.url));
}

await main();

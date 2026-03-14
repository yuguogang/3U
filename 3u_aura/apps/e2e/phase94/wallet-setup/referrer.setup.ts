import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineWalletSetup } from "@synthetixio/synpress";
import { MetaMask, getExtensionId } from "@synthetixio/synpress/playwright";

const WALLET_PASSWORD =
  process.env.SYNPRESS_WALLET_PASSWORD || "3u-aura-e2e-wallet";
const DUMMY_SEED_PHRASE =
  "test test test test test test test test test test test junk";
const FILE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = findRepoRoot(FILE_DIR);

function findRepoRoot(startDir: string) {
  let currentDir = startDir;

  while (!fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error("Unable to resolve repository root from wallet setup file");
    }
    currentDir = parentDir;
  }

  return currentDir;
}

function getEnvironmentName() {
  return (
    process.env.PROMOTION_E2E_ENV ||
    process.env.PROMOTION_ENV ||
    "uat-mockusdt"
  );
}

export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  const extensionId = await getExtensionId(context, "MetaMask");
  const metamask = new MetaMask(
    context,
    walletPage,
    WALLET_PASSWORD,
    extensionId,
  );
  const wallet = JSON.parse(
    fs.readFileSync(
      path.join(
        REPO_ROOT,
        "config",
        "promotion-envs",
        getEnvironmentName(),
        "wallets",
        "referrer.json",
      ),
      "utf8",
    ),
  ) as { privateKey: `0x${string}` };

  await metamask.importWallet(DUMMY_SEED_PHRASE);
  await metamask.importWalletFromPrivateKey(wallet.privateKey);
  await metamask.switchAccount("Account 2");
  await metamask.addNetwork({
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    symbol: "tBNB",
    blockExplorerUrl: "https://testnet.bscscan.com",
  });
  await metamask.switchNetwork("BSC Testnet");
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import { MetaMask, getExtensionId } from "@synthetixio/synpress/playwright";
import { loadRuntimeConfig, loadWalletFixture } from "./runtime";

const WALLET_PASSWORD =
  process.env.SYNPRESS_WALLET_PASSWORD || "3u-aura-e2e-wallet";
const DUMMY_SEED_PHRASE =
  "test test test test test test test test test test test junk";

type WalletName = "admin" | "referrer" | "userA" | "userB" | "userC";

function resolveMetaMaskExtensionPath() {
  const runtime = loadRuntimeConfig();
  const extensionPath = path.join(
    runtime.projectRoot,
    ".cache-synpress",
    "metamask-chrome-11.9.1",
  );

  if (!fs.existsSync(extensionPath)) {
    throw new Error(
      `MetaMask extension directory is missing at ${extensionPath}. Build or download the extension first.`,
    );
  }

  return extensionPath;
}

export async function createMetaMaskSession(walletName: WalletName) {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture(walletName, runtime.environment);
  const extensionPath = resolveMetaMaskExtensionPath();
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `phase94-${walletName}-`),
  );

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    const extensionPage = await context.waitForEvent("page", {
      timeout: 30_000,
    });
    const extensionId = await getExtensionId(context, "MetaMask");
    const metamask = new MetaMask(
      context,
      extensionPage,
      WALLET_PASSWORD,
      extensionId,
    );

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

    const page = await context.newPage();

    return {
      context,
      metamask,
      page,
      wallet,
      async cleanup() {
        await context.close();
        fs.rmSync(userDataDir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

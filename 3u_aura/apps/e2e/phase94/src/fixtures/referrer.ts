import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import referrerSetup from "../../wallet-setup/referrer.setup";

export const test = testWithSynpress(metaMaskFixtures(referrerSetup)).extend<{
  metamask: MetaMask;
}>({
  metamask: async ({ context, metamaskPage, extensionId }, use) => {
    const metamask = new MetaMask(
      context,
      metamaskPage,
      referrerSetup.walletPassword,
      extensionId,
    );
    await use(metamask);
  },
});

export const { expect } = test;

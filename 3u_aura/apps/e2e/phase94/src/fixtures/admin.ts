import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import adminSetup from "../../wallet-setup/admin.setup";

export const test = testWithSynpress(metaMaskFixtures(adminSetup)).extend<{
  metamask: MetaMask;
}>({
  metamask: async ({ context, metamaskPage, extensionId }, use) => {
    const metamask = new MetaMask(
      context,
      metamaskPage,
      adminSetup.walletPassword,
      extensionId,
    );
    await use(metamask);
  },
});

export const { expect } = test;

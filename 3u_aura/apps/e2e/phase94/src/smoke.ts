import type { Page } from "@playwright/test";
import type { MetaMask } from "@synthetixio/synpress/playwright";

export async function findButton(
  page: Page,
  testId: string,
  accessibleName: RegExp,
) {
  const testIdLocator = page.getByTestId(testId);
  if ((await testIdLocator.count()) > 0) {
    return testIdLocator.first();
  }

  return page.getByRole("button", { name: accessibleName });
}

export async function chooseMetaMaskConnector(page: Page) {
  await page.getByRole("button", { name: /MetaMask/i }).click();
}

export async function connectWalletFromDapp(
  page: Page,
  metamask: MetaMask,
  connectButtonTestId: string,
) {
  const connectButton = await findButton(
    page,
    connectButtonTestId,
    /connect wallet/i,
  );
  await connectButton.click();
  await chooseMetaMaskConnector(page);
  await metamask.connectToDapp();
}

export async function finishDappSignin(page: Page, metamask: MetaMask) {
  const signinButton = await findButton(
    page,
    "wallet-signin-button",
    /^0x/i,
  );
  if (await signinButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await signinButton.click();
  }

  await metamask.confirmSignature();
}

export async function finishAdminSignin(page: Page, metamask: MetaMask) {
  const adminSigninButton = await findButton(
    page,
    "admin-wallet-signin-button",
    /sign in as admin/i,
  );
  await adminSigninButton.click();
  await metamask.confirmSignature();
}

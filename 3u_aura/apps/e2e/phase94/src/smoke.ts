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
  await page.getByRole("heading", { name: /Connect a Wallet/i }).waitFor({
    timeout: 10_000,
  });

  const browserWalletButton = page.getByRole("button", {
    name: /Browser Wallet/i,
  });
  if ((await browserWalletButton.count()) > 0) {
    await browserWalletButton.first().click();
    return;
  }

  await page.getByRole("button", { name: /MetaMask/i }).click();
}

function resolveWalletStateTestIds(connectButtonTestId: string) {
  switch (connectButtonTestId) {
    case "wallet-connect-button":
      return {
        accountButtonTestId: "wallet-account-button",
        signinButtonTestId: "wallet-signin-button",
      };
    case "admin-wallet-connect-button":
      return {
        accountButtonTestId: "admin-wallet-account-button",
        signinButtonTestId: "admin-wallet-signin-button",
      };
    default:
      throw new Error(`Unsupported wallet connect button: ${connectButtonTestId}`);
  }
}

async function waitForConnectedWalletUi(
  page: Page,
  connectButtonTestId: string,
  timeout: number,
) {
  const { accountButtonTestId, signinButtonTestId } =
    resolveWalletStateTestIds(connectButtonTestId);

  return Promise.any([
    page.getByTestId(accountButtonTestId).waitFor({ state: "visible", timeout }),
    page.getByTestId(signinButtonTestId).waitFor({ state: "visible", timeout }),
  ]);
}

async function waitForNotificationPageReady(
  metamask: MetaMask,
  timeout: number,
) {
  if (!metamask.extensionId) {
    throw new Error("MetaMask extensionId is required for dapp connection");
  }

  const extensionPrefix = `chrome-extension://${metamask.extensionId}`;
  const notificationPrefix = `chrome-extension://${metamask.extensionId}/notification.html`;

  const resolveNotificationPage = () =>
    metamask.context
      .pages()
      .find((page) => page.url().startsWith(notificationPrefix));

  const existingNotificationPage = resolveNotificationPage();
  if (existingNotificationPage) {
    return;
  }

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    const pages = metamask.context.pages();
    const candidatePage = pages.find(
      (page) =>
        page !== metamask.page &&
        (page.url() === "about:blank" || page.url().startsWith(extensionPrefix)),
    );

    if (candidatePage) {
      try {
        await candidatePage.waitForURL(
          (url) => url.toString().startsWith(notificationPrefix),
          { timeout: remaining },
        );
        return;
      } catch {
        // fall through and retry while the popup lifecycle is still in motion
      }
    }

    try {
      const popupPage = await metamask.context.waitForEvent("page", {
        timeout: Math.min(remaining, 1_000),
      });

      if (
        popupPage.url() === "about:blank" ||
        popupPage.url().startsWith(extensionPrefix)
      ) {
        await popupPage.waitForURL(
          (url) => url.toString().startsWith(notificationPrefix),
          { timeout: remaining },
        );
        return;
      }
    } catch {
      const notificationPage = resolveNotificationPage();
      if (notificationPage) {
        return;
      }
    }
  }

  throw new Error("MetaMask notification page did not become ready in time");
}

async function waitForNotificationApproval(
  metamask: MetaMask,
  timeout: number,
) {
  await waitForNotificationPageReady(metamask, timeout);
  await metamask.connectToDapp();
}

async function confirmMetaMaskSignature(metamask: MetaMask, timeout = 20_000) {
  await waitForNotificationPageReady(metamask, timeout);
  await metamask.confirmSignature();
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

  await Promise.any([
    waitForConnectedWalletUi(page, connectButtonTestId, 20_000),
    (async () => {
      await waitForNotificationApproval(metamask, 20_000);
      await waitForConnectedWalletUi(page, connectButtonTestId, 10_000);
    })(),
  ]);
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

  await confirmMetaMaskSignature(metamask);
}

export async function finishAdminSignin(page: Page, metamask: MetaMask) {
  const adminSigninButton = await findButton(
    page,
    "admin-wallet-signin-button",
    /sign in as admin/i,
  );
  await adminSigninButton.click();
  await confirmMetaMaskSignature(metamask);
}

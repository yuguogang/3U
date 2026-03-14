import { test, expect } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { createMetaMaskSession } from "../../src/metamask-session";
import {
  connectWalletFromDapp,
  findButton,
  finishAdminSignin,
} from "../../src/smoke";
import { loadRuntimeConfig } from "../../src/runtime";

test("@smoke admin can connect wallet and sign into admin dashboard", async () => {
  const runtime = loadRuntimeConfig();
  const session = await createMetaMaskSession("admin");

  try {
    await session.page.goto(`${runtime.manifest.infra.admin.baseUrl}/dashboard`);
    await connectWalletFromDapp(
      session.page,
      session.metamask,
      "admin-wallet-connect-button",
    );
    await finishAdminSignin(session.page, session.metamask);

    await expect(
      await findButton(
        session.page,
        "admin-wallet-signout-button",
        /sign out/i,
      ),
    ).toBeVisible({ timeout: 30_000 });
    await expect(session.page.getByText("Overview")).toBeVisible();

    appendUatReport({
      test: "admin-login",
      step: "admin-dashboard-login",
      wallet: session.wallet.address,
      result: "success",
      uiCheckpoint: `${runtime.manifest.infra.admin.baseUrl}/dashboard`,
    });
  } finally {
    await session.cleanup();
  }
});

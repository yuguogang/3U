import { test, expect } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { createMetaMaskSession } from "../../src/metamask-session";
import { connectWalletFromDapp, finishDappSignin } from "../../src/smoke";
import { loadRuntimeConfig } from "../../src/runtime";

test("@smoke referrer can connect wallet and sign into dapp", async () => {
  const runtime = loadRuntimeConfig();
  const session = await createMetaMaskSession("referrer");

  try {
    await session.page.goto(runtime.manifest.infra.dapp.baseUrl);
    await connectWalletFromDapp(
      session.page,
      session.metamask,
      "wallet-connect-button",
    );
    await finishDappSignin(session.page, session.metamask);

    await session.page.goto(`${runtime.manifest.infra.dapp.baseUrl}/team`);
    await expect(session.page.getByTestId("team-invite-code")).not.toHaveText(
      "-",
    );

    appendUatReport({
      test: "dapp-login",
      step: "referrer-login",
      wallet: session.wallet.address,
      result: "success",
      uiCheckpoint: `${runtime.manifest.infra.dapp.baseUrl}/team`,
    });
  } finally {
    await session.cleanup();
  }
});

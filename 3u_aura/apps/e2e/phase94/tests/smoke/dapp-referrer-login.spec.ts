import { test, expect } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { bootstrapDappSession } from "../../src/session-bootstrap";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";

test("@smoke referrer can bootstrap an authenticated dapp session", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture("referrer", runtime.environment);

  await bootstrapDappSession(page, wallet);
  await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/team`);
  await expect(page.getByTestId("team-invite-code")).not.toHaveText("-", {
    timeout: 30_000,
  });

  appendUatReport({
    test: "dapp-login",
    step: "referrer-bootstrap-login",
    wallet: wallet.address,
    result: "success",
    uiCheckpoint: `${runtime.manifest.infra.dapp.baseUrl}/team`,
  });
});

import { test, expect } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { loadRuntimeConfig } from "../../src/runtime";
import { findButton } from "../../src/smoke";

test("@smoke dapp and admin shells are reachable", async ({ page }) => {
  const runtime = loadRuntimeConfig();

  await page.goto(runtime.manifest.infra.dapp.baseUrl);
  await expect(
    await findButton(page, "wallet-connect-button", /connect wallet/i),
  ).toBeVisible();
  appendUatReport({
    test: "shell",
    step: "dapp-shell",
    result: "success",
    uiCheckpoint: runtime.manifest.infra.dapp.baseUrl,
  });

  await page.goto(`${runtime.manifest.infra.admin.baseUrl}/dashboard`);
  await expect(
    await findButton(page, "admin-wallet-connect-button", /connect wallet/i),
  ).toBeVisible();
  appendUatReport({
    test: "shell",
    step: "admin-shell",
    result: "success",
    uiCheckpoint: `${runtime.manifest.infra.admin.baseUrl}/dashboard`,
  });
});

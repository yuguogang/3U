import { test, expect } from "@playwright/test";
import { appendUatReport } from "../src/report";
import { collectWalletFundingStatuses } from "../src/precheck";
import { loadRuntimeConfig, loadWalletFixtures } from "../src/runtime";

test("@smoke precheck validates manifest, service health, and wallet funding", async ({
  request,
}) => {
  const runtime = loadRuntimeConfig();
  const wallets = loadWalletFixtures(runtime.environment);

  expect(runtime.manifest.status).toBe("active");
  expect(wallets.map((wallet) => wallet.name)).toEqual([
    "admin",
    "referrer",
    "userA",
    "userB",
    "userC",
  ]);

  const healthResponse = await request.get(
    new URL("/api/v1/health", runtime.manifest.infra.server.publicApiBaseUrl).toString(),
  );

  expect(healthResponse.ok()).toBeTruthy();
  appendUatReport({
    test: "precheck",
    step: "server-health",
    result: "success",
    apiStatus: healthResponse.status(),
    uiCheckpoint: runtime.manifest.infra.server.publicApiBaseUrl,
  });

  const fundingStatuses = await collectWalletFundingStatuses(wallets);
  for (const status of fundingStatuses) {
    expect(status.meetsBnbTarget).toBeTruthy();
    expect(status.meetsMockUsdtTarget).toBeTruthy();
    appendUatReport({
      test: "precheck",
      step: "wallet-funding",
      wallet: status.wallet.address,
      result: "success",
      uiCheckpoint: `bnb=${status.currentBnb},mockUsdt=${status.currentMockUsdt}`,
    });
  }
});

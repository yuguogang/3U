import { test, expect } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { bootstrapAdminSession } from "../../src/session-bootstrap";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";

test("@smoke admin can bootstrap an authenticated dashboard session", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture("admin", runtime.environment);

  await bootstrapAdminSession(page, wallet);
  await page.goto(`${runtime.manifest.infra.admin.baseUrl}/dashboard`);
  await expect(page.getByText("Authenticated admin session")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { name: "Promotion Overview" }),
  ).toBeVisible({
    timeout: 30_000,
  });

  appendUatReport({
    test: "admin-login",
    step: "admin-bootstrap-login",
    wallet: wallet.address,
    result: "success",
    uiCheckpoint: `${runtime.manifest.infra.admin.baseUrl}/dashboard`,
  });
});

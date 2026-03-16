import { expect, test } from "@playwright/test";
import { appendUatReport } from "../../src/report";
import { sendCheckinPayment } from "../../src/checkin-payment";
import { getMyProfile } from "../../src/server-api";
import { bootstrapDappSession } from "../../src/session-bootstrap";
import { loadRuntimeConfig, loadWalletFixture } from "../../src/runtime";

test("@phase94-core userB can submit a confirmed daily check-in receipt", async ({
  page,
}) => {
  const runtime = loadRuntimeConfig();
  const wallet = loadWalletFixture("userB", runtime.environment);

  try {
    const signin = await bootstrapDappSession(page, wallet);
    const beforeProfile = (await getMyProfile(signin.accessToken)).data;
    const beforeTotalCheckinCount =
      beforeProfile.profile?.totalCheckinCount ?? 0;
    const beforeTotalCheckinUsdt = BigInt(
      beforeProfile.profile?.totalCheckinUsdt ?? "0",
    );

    const payment = await sendCheckinPayment(wallet);

    await page.goto(`${runtime.manifest.infra.dapp.baseUrl}/checkin`);
    await page.getByTestId("checkin-txhash-input").fill(payment.hash);
    await page.getByTestId("checkin-submit-button").click();

    await expect(page.locator("body")).toContainText("Submitted");

    await expect
      .poll(async () => {
        const profile = (await getMyProfile(signin.accessToken)).data.profile;
        return JSON.stringify({
          totalCheckinCount: profile?.totalCheckinCount ?? 0,
          totalCheckinUsdt: profile?.totalCheckinUsdt ?? "0",
        });
      })
      .toBe(
        JSON.stringify({
          totalCheckinCount: beforeTotalCheckinCount + 1,
          totalCheckinUsdt: (
            beforeTotalCheckinUsdt + BigInt(payment.amountAtomic)
          ).toString(),
        }),
      );

    appendUatReport({
      test: "checkin",
      step: "userB-submit-checkin",
      wallet: wallet.address,
      txHash: payment.hash,
      result: "success",
      apiStatus: 200,
      uiCheckpoint: `${runtime.manifest.infra.dapp.baseUrl}/checkin`,
    });
  } catch (error) {
    appendUatReport({
      test: "checkin",
      step: "userB-submit-checkin",
      wallet: wallet.address,
      result: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

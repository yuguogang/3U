import { expect, test } from "@playwright/test";
import {
  getWeeklyEpochBoundary,
  previewAdminEpochSync,
} from "../../src/server-api";
import { appendUatReport } from "../../src/report";
import {
  loadRuntimeConfig,
  loadWalletFixture,
  loadWeeklyForkRuntime,
} from "../../src/runtime";
import { bootstrapAdminSession } from "../../src/session-bootstrap";

async function requestRpcJson<T>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const response = await fetch(rpcUrl, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    result?: T;
  };

  if (payload.error) {
    throw new Error(payload.error.message ?? JSON.stringify(payload.error));
  }

  return payload.result as T;
}

test("@weekly-fork fork env exposes local RPC and weekly epoch preview", async ({
  page,
  request,
}) => {
  const runtime = loadRuntimeConfig();
  const forkRuntime = loadWeeklyForkRuntime(runtime.environment);
  const referenceAt = "2026-03-18T00:00:00.000Z";

  expect(runtime.manifest.infra.database.schema).not.toBe("public");
  expect(runtime.manifest.chain.rpcUrl).toContain("127.0.0.1");
  expect(forkRuntime?.anvilRpcUrl).toBe(runtime.manifest.chain.rpcUrl);

  const healthResponse = await request.get(
    new URL("/api/v1/health", runtime.manifest.infra.server.publicApiBaseUrl).toString(),
  );
  expect(healthResponse.ok()).toBeTruthy();

  const chainIdHex = await requestRpcJson<string>(
    runtime.manifest.chain.rpcUrl,
    "eth_chainId",
  );
  expect(chainIdHex.toLowerCase()).toBe("0x61");

  const boundary = await getWeeklyEpochBoundary(referenceAt);
  expect(boundary.data.epochType).toBe("WEEKLY_PROMOTION");
  expect(boundary.data.epochNo).toBeGreaterThan(0);

  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const signin = await bootstrapAdminSession(page, adminWallet);
  const epochPreview = await previewAdminEpochSync(
    signin.accessToken,
    referenceAt,
  );

  expect(epochPreview.data.result.referenceAt).toBe(referenceAt);
  expect(epochPreview.data.result.currentBoundary.epochNo).toBe(
    boundary.data.epochNo,
  );

  appendUatReport({
    test: "weekly-fork-precheck",
    step: "fork-rpc-epoch-preview",
    wallet: adminWallet.address,
    result: "success",
    apiStatus: epochPreview.status,
    uiCheckpoint: `chainId=${chainIdHex},epochNo=${boundary.data.epochNo}`,
  });
});

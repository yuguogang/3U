import path from "node:path";
import { defineConfig } from "@playwright/test";
import { loadRuntimeConfig } from "./src/runtime";

const runtime = loadRuntimeConfig();

process.env.PROMOTION_E2E_ENV = runtime.environment;
process.env.PROMOTION_E2E_RUN_ID = runtime.runId;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: runtime.artifactsDir,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: path.join(runtime.reportsDir, "html", runtime.runId),
      },
    ],
  ],
  use: {
    headless: process.env.HEADLESS === "true",
    channel: process.env.HEADLESS === "true" ? "chromium" : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: {
      width: 1440,
      height: 960,
    },
  },
  globalSetup: "./src/global-setup.ts",
});

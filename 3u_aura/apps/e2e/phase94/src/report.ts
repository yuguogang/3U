import fs from "node:fs";
import { ensureDir, loadRuntimeConfig } from "./runtime";

export type UatReportEntry = {
  test: string;
  step: string;
  wallet?: `0x${string}` | string;
  txHash?: `0x${string}` | string;
  result: "success" | "failed" | "blocked";
  apiStatus?: number;
  uiCheckpoint?: string;
  error?: string;
  timestamp?: string;
};

type UatReportDocument = {
  runId: string;
  environment: string;
  chainId: number;
  startedAt: string;
  dappBaseUrl: string;
  adminBaseUrl: string;
  serverBaseUrl: string;
  entries: UatReportEntry[];
};

function readReport(): UatReportDocument {
  const runtime = loadRuntimeConfig();

  if (!fs.existsSync(runtime.uatReportPath)) {
    return resetUatReport();
  }

  return JSON.parse(fs.readFileSync(runtime.uatReportPath, "utf8")) as UatReportDocument;
}

export function resetUatReport() {
  const runtime = loadRuntimeConfig();
  ensureDir(runtime.reportsDir);
  ensureDir(runtime.artifactsDir);

  const nextReport: UatReportDocument = {
    runId: runtime.runId,
    environment: runtime.environment,
    chainId: runtime.manifest.chain.id,
    startedAt: new Date().toISOString(),
    dappBaseUrl: runtime.manifest.infra.dapp.baseUrl,
    adminBaseUrl: runtime.manifest.infra.admin.baseUrl,
    serverBaseUrl: runtime.manifest.infra.server.publicApiBaseUrl,
    entries: [],
  };

  fs.writeFileSync(
    runtime.uatReportPath,
    `${JSON.stringify(nextReport, null, 2)}\n`,
    "utf8",
  );

  return nextReport;
}

export function appendUatReport(entry: UatReportEntry) {
  const runtime = loadRuntimeConfig();
  const currentReport = readReport();
  currentReport.entries.push({
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  });

  fs.writeFileSync(
    runtime.uatReportPath,
    `${JSON.stringify(currentReport, null, 2)}\n`,
    "utf8",
  );
}

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { REPO_ROOT, loadManifest } from '../promotion-env/lib.mjs';

const SERVICE_NAMES = ['server', 'dapp', 'admin'];
const START_TIMEOUT_MS = 120_000;
const STOP_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 500;

function resolvePnpmBinary() {
  const candidates = [
    process.env.PNPM_BIN,
    '/usr/local/bin/pnpm',
    '/opt/homebrew/bin/pnpm',
    'pnpm',
  ].filter(Boolean);

  return candidates.find((value) => {
    if (value === 'pnpm') {
      return true;
    }

    return fs.existsSync(value);
  });
}

const PNPM_BIN = resolvePnpmBinary();
const NODE_BIN_DIR = path.dirname(process.execPath);

function buildProcessEnv(extra = {}) {
  return {
    ...process.env,
    PATH: [NODE_BIN_DIR, process.env.PATH].filter(Boolean).join(path.delimiter),
    ...extra,
  };
}

function parseUrlPort(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.port) {
    return Number(parsed.port);
  }

  return parsed.protocol === 'https:' ? 443 : 80;
}

function getEnvDir(envName) {
  return path.join(REPO_ROOT, 'config', 'promotion-envs', envName);
}

function getLogsDir(envName) {
  return path.join(getEnvDir(envName), 'logs');
}

function getRuntimePath(envName) {
  return path.join(getEnvDir(envName), 'services.runtime.json');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readRuntime(envName) {
  const runtimePath = getRuntimePath(envName);
  if (!fs.existsSync(runtimePath)) {
    return null;
  }

  return readJson(runtimePath);
}

function resolveServiceSpec(envName, manifest, serviceName) {
  switch (serviceName) {
    case 'server':
      return {
        appDir: 'apps/server',
        command: [PNPM_BIN, '--dir', 'apps/server', 'exec', 'node', 'dist/src/main.js'],
        envMarkers: [
          `PROMOTION_ENV=${envName}`,
          'PNPM_PACKAGE_NAME=3u-aura-server',
        ],
        logPath: path.join(getLogsDir(envName), 'server.log'),
        port: parseUrlPort(manifest.infra.server.publicApiBaseUrl),
        readyUrl: new URL('/api/v1/health', manifest.infra.server.publicApiBaseUrl).toString(),
        serviceName,
        target: 'server',
      };
    case 'dapp':
      return {
        appDir: 'apps/dapp',
        command: [
          PNPM_BIN,
          '--dir',
          'apps/dapp',
          'exec',
          'next',
          'dev',
          '--webpack',
          '-p',
          String(parseUrlPort(manifest.infra.dapp.baseUrl)),
        ],
        envMarkers: [
          `PROMOTION_ENV=${envName}`,
          'PNPM_PACKAGE_NAME=3u-aura-dapp',
          `PWD=${path.join(REPO_ROOT, 'apps', 'dapp')}`,
        ],
        logPath: path.join(getLogsDir(envName), 'dapp.log'),
        port: parseUrlPort(manifest.infra.dapp.baseUrl),
        readyUrl: manifest.infra.dapp.baseUrl,
        serviceName,
        target: 'dapp',
      };
    case 'admin':
      return {
        appDir: 'apps/admin',
        command: [
          PNPM_BIN,
          '--dir',
          'apps/admin',
          'exec',
          'next',
          'dev',
          '--webpack',
          '-p',
          String(parseUrlPort(manifest.infra.admin.baseUrl)),
        ],
        envMarkers: [
          `PROMOTION_ENV=${envName}`,
          'PNPM_PACKAGE_NAME=3u-aura-admin',
          `PWD=${path.join(REPO_ROOT, 'apps', 'admin')}`,
        ],
        logPath: path.join(getLogsDir(envName), 'admin.log'),
        port: parseUrlPort(manifest.infra.admin.baseUrl),
        readyUrl: manifest.infra.admin.baseUrl,
        serviceName,
        target: 'admin',
      };
    default:
      throw new Error(`Unsupported service "${serviceName}"`);
  }
}

function ensureServerBuildArtifact(spec) {
  if (spec.serviceName !== 'server') {
    return;
  }

  const result = spawnSync(PNPM_BIN, ['--dir', path.join(REPO_ROOT, spec.appDir), 'run', 'build'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: buildProcessEnv(),
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Failed to build server runtime for ${spec.serviceName}${
        output ? `:\n${output}` : ''
      }`,
    );
  }
}

function listListeningPids(port) {
  const result = spawnSync(
    'lsof',
    ['-nP', `-tiTCP:${port}`, '-sTCP:LISTEN'],
    {
      encoding: 'utf8',
    },
  );

  if (result.status !== 0 || !result.stdout.trim()) {
    return [];
  }

  return result.stdout
    .trim()
    .split('\n')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function readProcessSnapshot(pid) {
  const result = spawnSync('ps', ['eww', '-p', String(pid)], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return '';
  }

  return result.stdout;
}

function readParentPid(pid) {
  const result = spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  const value = Number(result.stdout.trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isMatchingServiceProcess(spec, snapshot) {
  return spec.envMarkers.every((marker) => snapshot.includes(marker));
}

function resolveServiceOwnerPid(spec, pid) {
  const snapshot = readProcessSnapshot(pid);
  if (isMatchingServiceProcess(spec, snapshot)) {
    return pid;
  }

  const parentPid = readParentPid(pid);
  if (!parentPid || parentPid === pid) {
    return null;
  }

  return isMatchingServiceProcess(spec, readProcessSnapshot(parentPid))
    ? parentPid
    : null;
}

async function waitForUrl(rawUrl, timeoutMs = START_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(rawUrl);
      if (response.ok) {
        return;
      }

      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    await delay(POLL_INTERVAL_MS);
  }

  const suffix =
    lastError instanceof Error ? `: ${lastError.message}` : '';
  throw new Error(`Timed out waiting for ${rawUrl}${suffix}`);
}

function startManagedProcess(spec, envName, envOverrides = {}) {
  ensureServerBuildArtifact(spec);
  ensureDir(getLogsDir(envName));
  const logFd = fs.openSync(spec.logPath, 'a');
  const child = spawn(
    process.execPath,
    [
      path.join(REPO_ROOT, 'scripts', 'promotion-env', 'run-with-env.mjs'),
      '--target',
      spec.target,
      '--env',
      envName,
      '--',
      ...spec.command,
    ],
    {
      cwd: REPO_ROOT,
      detached: true,
      env: {
        ...buildProcessEnv(),
        ...envOverrides,
      },
      stdio: ['ignore', logFd, logFd],
    },
  );

  child.unref();
  fs.closeSync(logFd);

  return child.pid;
}

function resolveListeningOwnerPid(spec) {
  const listeningPids = listListeningPids(spec.port);
  return (
    listeningPids
      .map((pid) => resolveServiceOwnerPid(spec, pid))
      .find((pid) => Number.isFinite(pid) && pid > 0) ?? null
  );
}

function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopProcessGroup(pid) {
  if (!isProcessAlive(pid)) {
    return false;
  }

  const signals = ['SIGTERM', 'SIGKILL'];

  for (const signal of signals) {
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        process.kill(pid, signal);
      } catch {
        return false;
      }
    }

    const deadline = Date.now() + STOP_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (!isProcessAlive(pid)) {
        return true;
      }

      await delay(POLL_INTERVAL_MS);
    }
  }

  return !isProcessAlive(pid);
}

export async function startPromotionServices({
  envName,
  services = SERVICE_NAMES,
  serviceEnvOverrides = {},
}) {
  const manifest = loadManifest(envName);
  const existingRuntime = readRuntime(envName);
  const runtime = {
    envName,
    services: {},
    updatedAt: null,
  };

  for (const serviceName of services) {
    const spec = resolveServiceSpec(envName, manifest, serviceName);
    const listeningPids = listListeningPids(spec.port);
    const matchingPid =
      listeningPids
        .map((pid) => resolveServiceOwnerPid(spec, pid))
        .find((pid) => Number.isFinite(pid) && pid > 0) ?? null;

    if (matchingPid) {
      await waitForUrl(spec.readyUrl);
      const existingRecord = existingRuntime?.services?.[serviceName];
      const managedPid =
        existingRecord?.managed
          ? matchingPid
          : null;
      runtime.services[serviceName] = {
        logPath: spec.logPath,
        managed: Boolean(managedPid),
        pid: managedPid ?? matchingPid,
        port: spec.port,
        readyUrl: spec.readyUrl,
        reused: true,
        startedAt: managedPid ? existingRecord?.startedAt ?? null : null,
      };
      continue;
    }

    if (listeningPids.length > 0) {
      throw new Error(
        `Port ${spec.port} is already in use by a non-${envName} ${serviceName} process: ${listeningPids.join(', ')}`,
      );
    }

    const pid = startManagedProcess(
      spec,
      envName,
      serviceEnvOverrides[serviceName] ?? {},
    );

    try {
      await waitForUrl(spec.readyUrl);
    } catch (error) {
      await stopProcessGroup(pid);
      throw new Error(
        `Failed to start ${serviceName} for ${envName}. See ${spec.logPath}. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const ownerPid = resolveListeningOwnerPid(spec) ?? pid;
    runtime.services[serviceName] = {
      logPath: spec.logPath,
      managed: true,
      pid: ownerPid,
      port: spec.port,
      readyUrl: spec.readyUrl,
      reused: false,
      startedAt: new Date().toISOString(),
    };
  }

  runtime.updatedAt = new Date().toISOString();
  writeJson(getRuntimePath(envName), runtime);
  return runtime;
}

export async function stopPromotionServices({
  envName,
  services = SERVICE_NAMES,
  includeUnmanaged = false,
}) {
  const runtime = readRuntime(envName);
  const nextRuntime = runtime ?? {
    envName,
    services: {},
    updatedAt: null,
  };

  const stopped = [];
  for (const serviceName of services) {
    const record = nextRuntime.services?.[serviceName];
    const spec = resolveServiceSpec(envName, loadManifest(envName), serviceName);
    const managedOwnerPid = record?.pid
      ? resolveServiceOwnerPid(spec, record.pid)
      : null;
    const unmanagedOwnerPid =
      includeUnmanaged && !managedOwnerPid
        ? resolveListeningOwnerPid(spec)
        : null;
    const ownerPid = managedOwnerPid ?? unmanagedOwnerPid;
    if (!ownerPid) {
      continue;
    }

    const didStop = await stopProcessGroup(ownerPid);
    stopped.push({
      pid: ownerPid,
      serviceName,
      stopped: didStop,
    });
    delete nextRuntime.services[serviceName];
  }

  nextRuntime.updatedAt = new Date().toISOString();
  writeJson(getRuntimePath(envName), nextRuntime);

  return {
    envName,
    services: nextRuntime.services,
    stopped,
  };
}

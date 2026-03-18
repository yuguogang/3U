import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function getRepoRoot() {
  return REPO_ROOT;
}

export function getCiRuntimeDir(envName = 'fork-anvil') {
  return path.join(REPO_ROOT, 'scripts', 'ci', '.runtime', envName);
}

export function getCiRuntimePath(envName = 'fork-anvil') {
  return path.join(getCiRuntimeDir(envName), 'runtime.json');
}

export function getCiManifestPath(envName = 'fork-anvil') {
  return path.join(getCiRuntimeDir(envName), 'manifest.json');
}

export function getCiBroadcastArchiveDir(envName = 'fork-anvil') {
  return path.join(getCiRuntimeDir(envName), 'broadcasts');
}

export function loadCiRuntime(envName = 'fork-anvil') {
  const runtimePath = getCiRuntimePath(envName);
  if (!fs.existsSync(runtimePath)) {
    return null;
  }

  return readJson(runtimePath);
}

export function loadCiManifest(envName = 'fork-anvil') {
  const manifestPath = getCiManifestPath(envName);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return readJson(manifestPath);
}

export function writeCiRuntime(envName, runtime) {
  writeJson(getCiRuntimePath(envName), runtime);
  return runtime;
}

export function writeCiManifest(envName, manifest) {
  writeJson(getCiManifestPath(envName), manifest);
  return manifest;
}

export function archiveBroadcastFile(envName, sourceFilePath, label) {
  const archiveDir = path.join(getCiBroadcastArchiveDir(envName), label);
  ensureDir(archiveDir);
  const targetPath = path.join(archiveDir, path.basename(sourceFilePath));
  fs.copyFileSync(sourceFilePath, targetPath);
  return targetPath;
}

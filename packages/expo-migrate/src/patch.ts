import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import { sync as globSync } from 'glob';
import os from 'os';
import path from 'path';
import process from 'process';
import semver from 'semver';
import temporary from 'tempy';
import which from 'which';

const PATCH_ROOT = path.join(__dirname, '..', 'patches');
const RN_PATCH_PREFIX = 'react-native@';

export async function generatePatchFile(
  projectRoot: string,
  appName: string,
  rnVersion: string
): Promise<string> {
  const basePatchFile = findBasePatchFile(rnVersion);
  if (!basePatchFile) {
    throw new Error(`Unable to find base patch file based on react-native v${rnVersion}`);
  }

  let patchContent = await fs.readFile(basePatchFile, 'utf8');
  patchContent = patchContent
    .replaceAll('HelloWorld', appName)
    .replaceAll('helloworld', appName.toLowerCase());

  const patchFile = temporary.file({ extension: 'patch' });
  await fs.writeFile(patchFile, patchContent);

  return patchFile;
}

export async function applyPatchAsync(projectRoot: string, patchFile: string): Promise<void> {
  const patchBin = await getPatchBinAsync();
  console.log('patchFile', patchFile);
  await spawnAsync(patchBin, ['-p1', '-i', patchFile], { stdio: 'inherit', cwd: projectRoot });
}

export function showPatchFileAsync(patchFile: string) {
  return spawnAsync(getPagerBin(), [patchFile], { shell: true, stdio: 'inherit' });
}

async function getPatchBinAsync(): Promise<string> {
  // TODO: For windows, include a prebuilt gnuwin32 patch.exe !?
  return which('patch');
}

function getPagerBin(): string {
  if (os.platform() === 'win32') {
    return 'more';
  }
  return process.env['PAGER'] ?? 'more';
}

function findBasePatchFile(version: string): string | null {
  const PREFIX_LENGTH = RN_PATCH_PREFIX.length;
  const matches = globSync(`${RN_PATCH_PREFIX}*`, { cwd: PATCH_ROOT, absolute: true });
  for (const match of matches) {
    const { name } = path.parse(match);
    const patchVersion = name.substr(PREFIX_LENGTH);
    if (semver.satisfies(version, patchVersion)) {
      return match;
    }
  }
  return null;
}

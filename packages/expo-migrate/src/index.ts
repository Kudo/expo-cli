import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import path from 'path';
import process from 'process';
import prompts from 'prompts';

import { applyPatchAsync, generatePatchFile, showPatchFileAsync } from './patch';
import { getAppName, getPackageVersionAsync } from './project';

async function runAsync(programName: string) {
  const projectRoot = path.resolve(process.cwd());
  const appName = getAppName(projectRoot);

  console.log(chalk.magenta('\u203A Preparing patch files...'));
  const rnVersion = await getPackageVersionAsync(projectRoot, 'react-native');
  const patchFile = await generatePatchFile(projectRoot, appName, rnVersion);

  console.log('patchFile', patchFile);
  let proceed = await confirmAsync('Continue to show patch files?', true);
  if (!proceed) {
    return;
  }

  await showPatchFileAsync(patchFile);

  console.log('\n\n\n\n\n');
  proceed = await confirmAsync(chalk.magenta('Continue to apply patches into project?'), false);
  if (!proceed) {
    return;
  }

  await applyPatchAsync(projectRoot, patchFile);

  console.log(chalk.magenta('\u203A yarn install'));
  await spawnAsync('yarn', ['install'], { cwd: projectRoot });

  console.log(chalk.magenta(`\u203A npx uri-scheme add ${appName.toLowerCase()}`));
  await spawnAsync('npx', ['uri-scheme', 'add', appName.toLowerCase()], { cwd: projectRoot });

  console.log(chalk.magenta('\u203A pod install'));
  await spawnAsync('pod', ['install'], { cwd: path.join(projectRoot, 'ios') });

  console.log(chalk.magenta('\u203A Done!'));
}

export function run(programName: string = 'expo-migrate') {
  runAsync(programName).catch(e => {
    // Log.error('Uncaught Error', e);
    console.error('Uncaught Error', e);
    process.exit(1);
  });
}

async function confirmAsync(message: string, initial: boolean = false): Promise<boolean> {
  const { value } = await prompts({
    name: 'value',
    type: 'confirm',
    message,
    initial,
  });
  return value ?? false;
}

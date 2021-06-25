import { getSourceRoot } from '@expo/config-plugins/build/ios/Paths';
import JsonFile from '@expo/json-file';
import path from 'path';
import resolveFrom from 'resolve-from';

export async function getPackageVersionAsync(
  projectRoot: string,
  packageName: string
): Promise<string> {
  try {
    const packageJson = await JsonFile.readAsync(
      resolveFrom(projectRoot, `${packageName}/package.json`)
    );
    return packageJson.version as string;
  } catch (e) {
    throw new Error(
      `Unable to get package version - package[${packageName}] projectRoot[${projectRoot}]`
    );
  }
}

export function getAppName(projectRoot: string) {
  const sourceRoot = getSourceRoot(projectRoot);
  return path.basename(sourceRoot);
}

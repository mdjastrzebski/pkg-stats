import chalk from 'chalk';

import { parseCliOptions, showHelp } from './cli-options.js';
import { fetchPackagesToCompare, printPackagesToCompare } from './mode/compare-packages.js';
import { fetchPackageInfo, printPackageInfo } from './mode/package-info.js';

export async function pkgStats(argv: string[]) {
  let options;
  try {
    options = parseCliOptions(argv);
  } catch (error) {
    showHelp();

    console.error(
      chalk.red(`Error parsing CLI options: ${error instanceof Error ? error.message : error}`),
    );
    process.exit(2);
  }

  if (options.packageNames.length === 1) {
    try {
      const packageInfo = await fetchPackageInfo(options.packageNames[0], options);
      printPackageInfo(packageInfo, options);
    } catch (error) {
      console.error(
        chalk.red(`Error fetching package info: ${error instanceof Error ? error.message : error}`),
      );
      process.exit(1);
    }
  } else {
    try {
      const packagesToCompare = await fetchPackagesToCompare(options.packageNames);
      printPackagesToCompare(packagesToCompare, options);
    } catch (error) {
      console.error(
        chalk.red(`Error fetching package info: ${error instanceof Error ? error.message : error}`),
      );
      process.exit(1);
    }
  }

  console.log('');
}

import chalk from 'chalk';

import { parseCliOptions, showHelp } from './cli-options.js';
import { comparePackages } from './mode/compare-packages.js';
import { printPackageStats } from './mode/package/package-stats.js';

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
    await printPackageStats(options.packageNames[0], options);
  } else {
    await comparePackages(options.packageNames, options);
  }

  console.log('');
}

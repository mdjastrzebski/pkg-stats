import chalk from 'chalk';

import { type CliOptions } from '../cli-options.js';
import { getLastWeeksDownloads } from '../utils/cache.js';
import { printChart } from '../utils/chart.js';
import { formatPercentage } from '../utils/format.js';

type PackageData = {
  packageName: string;
  downloads: number;
};

export async function comparePackages(packageNames: string[], options: CliOptions) {
  const rawPackages = await Promise.all(
    packageNames.map((packageName) => fetchPackageData(packageName)),
  );

  const packagesToDisplay = rawPackages
    .filter((pkg) => pkg !== undefined)
    .sort((a, b) => b.downloads - a.downloads);

  if (packagesToDisplay.length === 0) {
    console.error(chalk.red('\nNo packages found.\n'));
    process.exit(1);
  }

  console.log(chalk.bold(`\nNPM weekly downloads\n`));
  const maxDownloads = Math.max(...packagesToDisplay.map((item) => item.downloads));
  const items = packagesToDisplay.map((item) => ({
    label: item.packageName,
    value: item.downloads,
    extended: options.extended ? formatPercentage(item.downloads / maxDownloads) : undefined,
  }));

  printChart(items, {
    colorScheme: options.color,
    indent: 2,
  });
}

async function fetchPackageData(packageName: string): Promise<PackageData | undefined> {
  try {
    const data = await getLastWeeksDownloads(packageName);

    if (!Object.keys(data.last.downloads).length) {
      console.warn(chalk.yellow(`No data found for package "${packageName}".`));
      return undefined;
    }

    return {
      packageName,
      downloads: Object.values(data.last.downloads).reduce((sum, downloads) => sum + downloads, 0),
    };
  } catch (error) {
    console.warn(chalk.yellow(`Failed to fetch data for package "${packageName}"`, error));
    return undefined;
  }
}

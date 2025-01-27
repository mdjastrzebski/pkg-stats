import chalk from 'chalk';

import { renderChart } from '../chart.js';
import { type CliOptions } from '../cli-options.js';
import { getColors } from '../colors.js';
import { formatDownloads } from '../format.js';
import { fetchNpmLastWeekDownloads } from '../npm-api.js';

type PackageData = {
  packageName: string;
  downloads: number;
};

export async function fetchPackagesToCompare(packageNames: string[]): Promise<PackageData[]> {
  const rawPackages = await Promise.all(
    packageNames.map((packageName) => fetchPackageData(packageName)),
  );

  const packagesToDisplay = rawPackages
    .filter((pkg) => pkg !== undefined)
    .sort((a, b) => b.downloads - a.downloads);

  if (packagesToDisplay.length === 0) {
    throw new Error('No packages found.');
  }

  return packagesToDisplay;
}

export function printPackagesToCompare(packages: PackageData[], options: CliOptions) {
  console.log(chalk.bold(`\nNPM weekly downloads\n`));

  const maxDownloads = Math.max(...packages.map((v) => v.downloads));
  const displayData = packages.map((item) => {
    return {
      name: item.packageName,
      chart: renderChart(item.downloads / maxDownloads),
      downloads: formatDownloads(item.downloads, maxDownloads),
    };
  });

  const maxNameLength = Math.max(...displayData.map((item) => item.name.length));
  const maxDownloadsLength = Math.max(...displayData.map((item) => item.downloads.length));
  const colors = getColors(packages.length, options.color);
  displayData.forEach((item, i) => {
    const color = chalk.hex(colors[i]);
    console.log(
      `${item.name.padStart(2 + maxNameLength)} ${color(item.chart)} ${color(
        item.downloads.padStart(maxDownloadsLength),
      )}`,
    );
  });
}

async function fetchPackageData(packageName: string): Promise<PackageData | undefined> {
  try {
    const data = await fetchNpmLastWeekDownloads(packageName);

    if (!Object.keys(data.downloads).length) {
      console.warn(chalk.yellow(`No data found for package "${packageName}".`));
      return undefined;
    }

    return {
      packageName,
      downloads: Object.values(data.downloads).reduce((sum, downloads) => sum + downloads, 0),
    };
  } catch (error) {
    console.warn(chalk.yellow(`Failed to fetch data for package "${packageName}"`, error));
    return undefined;
  }
}

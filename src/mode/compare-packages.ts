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

  const maxDownloads = Math.max(...packagesToDisplay.map((v) => v.downloads));
  const displayData = packagesToDisplay.map((item) => {
    return {
      name: item.packageName,
      chart: renderChart(item.downloads / maxDownloads),
      downloads: formatDownloads(item.downloads, maxDownloads),
    };
  });

  const maxNameLength = Math.max(...displayData.map((item) => item.name.length));
  const maxDownloadsLength = Math.max(...displayData.map((item) => item.downloads.length));
  const colors = getColors(packagesToDisplay.length, options.color);
  displayData.forEach((item, i) => {
    const color = chalk.hex(colors[i]);
    console.log(
      `${item.name.padStart(2 + maxNameLength)} ${color(item.chart)} ${color(
        item.downloads.padStart(maxDownloadsLength),
      )}`,
    );
  });
}

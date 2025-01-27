import chalk from 'chalk';

import { renderChart } from '../chart.js';
import { type CliOptions } from '../cli-options.js';
import { getColors } from '../colors.js';
import { formatDownloads } from '../format.js';
import { fetchNpmLastWeekDownloads } from '../npm-api.js';
import { filterStats, groupStats } from '../stats.js';
import { parseVersion, versionCompare } from '../version.js';

export type FetchPackageInfoResult = {
  name: string;
  totalDownloads: number;
  groupingType: 'major' | 'minor' | 'patch';
  stats: {
    version: string;
    downloads: number;
  }[];
};

export type FetchPackageInfoOptions = {
  group?: 'major' | 'minor' | 'patch';
};

export async function fetchPackageInfo(
  packageName: string,
  options: FetchPackageInfoOptions,
): Promise<FetchPackageInfoResult> {
  const data = await fetchNpmLastWeekDownloads(packageName);

  if (!Object.keys(data.downloads).length) {
    throw new Error(`No data found for package "${packageName}".`);
  }

  const npmStats = Object.keys(data.downloads)
    .map((versionString) => {
      const version = parseVersion(versionString);
      return {
        ...version,
        downloads: data.downloads[versionString],
      };
    })
    .sort(versionCompare);

  const { type, stats } = groupStats(npmStats, options.group);
  const totalDownloads = Object.values(stats).reduce((sum, version) => sum + version.downloads, 0);

  return {
    name: packageName,
    totalDownloads,
    groupingType: type,
    stats: stats.map((stat) => ({
      version: stat.versionString,
      downloads: stat.downloads,
    })),
  };
}

export function printPackageInfo(
  { name, stats, totalDownloads, groupingType }: FetchPackageInfoResult,
  options: CliOptions,
) {
  const statsToDisplay = filterStats(stats, {
    totalDownloads,
    all: options.all,
    top: options.top,
  });

  const colors = getColors(statsToDisplay.length, options.color);
  const primaryColor = chalk.hex(colors[0]);

  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(name)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(
    options.top
      ? `Top ${options.top} ${groupingType} versions:\n`
      : `By ${groupingType} version:\n`,
  );

  const maxDownloads = Math.max(...stats.map((v) => v.downloads));
  const displayData = statsToDisplay.map((item) => {
    const versionParts = item.version.split('.');
    return {
      version: versionParts.length < 3 ? `${item.version}.x` : item.version,
      chart: renderChart(item.downloads / maxDownloads),
      downloads: formatDownloads(item.downloads, maxDownloads),
    };
  });

  const maxVersionLength = Math.max(...displayData.map((item) => item.version.length));
  const maxDownloadsLength = Math.max(...displayData.map((item) => item.downloads.length));
  displayData.forEach((item, i) => {
    const color = chalk.hex(colors[i]);
    console.log(
      `${item.version.padStart(2 + maxVersionLength)} ${color(item.chart)} ${color(
        item.downloads.padStart(maxDownloadsLength),
      )}`,
    );
  });

  console.log(chalk.bold(`\nNPM weekly downloads for ${chalk.green(name)}\n`));
  console.log(`Total: ${chalk.green(totalDownloads.toLocaleString())} last week\n`);
}

import chalk from 'chalk';

import { renderChart } from '../chart.js';
import { type CliOptions } from '../cli-options.js';
import { getColors } from '../colors.js';
import { formatDownloads } from '../format.js';
import { fetchNpmLastWeekDownloads, type NpmLastWeekDownloadsResponse } from '../npm-api.js';
import { type DisplayStats, filterStats, groupStats } from '../stats.js';
import { parseVersion, versionCompare } from '../version.js';

export async function printPackageStats(packageName: string, options: CliOptions) {
  let data: NpmLastWeekDownloadsResponse;
  try {
    data = await fetchNpmLastWeekDownloads(packageName);
  } catch (error) {
    console.error(`Failed to fetch data for package "${packageName}"`, error);
    return;
  }

  if (!Object.keys(data.downloads).length) {
    console.error(`No data found for package "${packageName}".\n`);
    process.exit(1);
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

  const statsToDisplay: DisplayStats[] = filterStats(stats, {
    totalDownloads,
    all: options.all,
    top: options.top,
  });

  const downloadToDisplay = statsToDisplay.reduce((sum, version) => sum + version.downloads, 0);
  if (totalDownloads - downloadToDisplay > 0) {
    statsToDisplay.push({
      versionString: 'rest',
      downloads: totalDownloads - downloadToDisplay,
    });
  }

  const colors = getColors(statsToDisplay.length, options.color);
  const primaryColor = chalk.hex(colors[0]);

  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(packageName)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} ${type} versions:\n` : `By ${type} version:\n`);

  const maxDownloads = Math.max(...statsToDisplay.map((v) => v.downloads));
  const displayData = statsToDisplay.map((item) => {
    return {
      version: item.versionString,
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
}

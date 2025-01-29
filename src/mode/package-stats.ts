import chalk from 'chalk';

import { type CliOptions } from '../cli-options.js';
import { getPrimaryColor } from '../colors.js';
import { fetchNpmLastWeekDownloads, type NpmLastWeekDownloadsResponse } from '../npm-api.js';
import { printChart } from '../output.js';
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

  const primaryColor = chalk.hex(getPrimaryColor(options.color));
  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(packageName)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} ${type} versions:\n` : `By ${type} version:\n`);

  const items = statsToDisplay.map((item) => ({
    label: item.versionString,
    value: item.downloads,
  }));

  printChart(items, { colorScheme: options.color, indent: 2 });
}

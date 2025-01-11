import chalk from 'chalk';

import { renderChart } from './chart.js';
import { parseCliOptions, showHelp } from './cli-options.js';
import { getColors } from './colors.js';
import {
  fetchNpmLastWeekDownloads,
  fetchNpmPackageLatestVersion,
  type NpmLastWeekDownloadsResponse,
  type NpmPackageLatestVersionResponse,
} from './npm-api.js';
import { groupByType, type GroupedStats, pickTopStats } from './stats.js';
import { parseVersion, versionCompare } from './version.js';

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

  let packageInfo: NpmPackageLatestVersionResponse;
  let downloads: NpmLastWeekDownloadsResponse;
  try {
    [packageInfo, downloads] = await Promise.all([
      fetchNpmPackageLatestVersion(options.packageName),
      fetchNpmLastWeekDownloads(options.packageName),
    ]);
  } catch (error) {
    console.error(`Failed to fetch data for package "${options.packageName}"`, error);
    return;
  }

  const primaryColor = chalk.hex(getColors(1, options.color)[0]);

  console.log(chalk.bold(`\nPackage: ${primaryColor(options.packageName)}`));
  console.log('Description:', primaryColor(packageInfo.description), '\n');

  console.log('License:', primaryColor(packageInfo.license));
  console.log('Latest version:', primaryColor(packageInfo.version));
  console.log('Repository:', primaryColor(packageInfo.repository?.url));
  console.log('Author:', primaryColor(packageInfo.author?.name));

  if (!Object.keys(downloads.downloads).length) {
    console.error(`No data found for package "${options.packageName}".\n`);
    process.exit(1);
  }

  const rawStats = Object.keys(downloads.downloads)
    .map((versionString) => {
      const version = parseVersion(versionString);
      return {
        ...version,
        downloads: downloads.downloads[versionString],
      };
    })
    .sort(versionCompare);

  const groupedStats: GroupedStats[] = groupByType(options.group, rawStats);
  const totalDownloads = Object.values(groupedStats).reduce(
    (sum, version) => sum + version.downloads,
    0,
  );

  const groupedStatsToDisplay = options.top
    ? pickTopStats(groupedStats, options.top)
    : groupedStats;

  const colors = getColors(groupedStatsToDisplay.length, options.color);
  console.log('');
  console.log(`Total downloads: ${primaryColor(totalDownloads.toLocaleString())} last week`);

  console.log(options.top ? `Top ${options.top} versions:\n` : 'By version:\n');

  const maxDownloads = Math.max(...groupedStats.map((v) => v.downloads));
  groupedStatsToDisplay.forEach((item, i) => {
    const versionParts = item.versionString.split('.');
    const version = versionParts.length < 3 ? `${item.versionString}.x` : item.versionString;
    const chart = renderChart(item.downloads / maxDownloads);
    const downloads = formatDownloads(item.downloads, maxDownloads);
    const color = chalk.hex(colors[i]);

    console.log(`${version.padStart(8)} ${color(chart)} ${color(downloads.padStart(6))}`);
  });

  console.log('');
}

function formatDownloads(downloads: number, maxDownloads: number) {
  if (maxDownloads > 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  }

  if (maxDownloads > 1000) {
    return `${(downloads / 1000).toFixed(1)}K`;
  }

  return downloads.toString();
}

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
import {
  groupByType,
  GroupByTypeResult,
  type GroupedStats,
  pickTopStats,
  trimVersion,
} from './stats.js';
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
  console.log(primaryColor(`"${packageInfo.description}"`), '\n');

  console.log('License:', primaryColor(packageInfo.license ?? 'n/a'));
  console.log('Latest version:', primaryColor(packageInfo.version ?? 'n/a'));
  console.log('Repository:', primaryColor(packageInfo.repositoryUrl ?? 'n/a'));
  if (packageInfo.author) {
    console.log('Author:', primaryColor(packageInfo.author));
  }

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

  const grouped = groupByType(options.group, rawStats);
  const totalDownloads = Object.values(grouped.result).reduce(
    (sum, version) => sum + version.downloads,
    0,
  );

  const groupedStatsToDisplay = options.top
    ? pickTopStats(grouped.result, options.top)
    : grouped.result;

  const latestVersion = parseVersion(packageInfo.version);
  const trimmedLatestVersion = trimVersion(latestVersion, grouped.type);
  console.log('AAA', trimmedLatestVersion);
  const colors = getColors(groupedStatsToDisplay.length, options.color);
  console.log('');
  console.log(`Total downloads: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} versions:\n` : 'Version:');

  const maxDownloads = Math.max(...grouped.result.map((v) => v.downloads));
  groupedStatsToDisplay.forEach((item, i) => {
    const versionParts = item.versionString.split('.');
    const version = versionParts.length < 3 ? `${item.versionString}.x` : item.versionString;
    const chart = renderChart(item.downloads / maxDownloads);
    const downloads = formatDownloads(item.downloads, maxDownloads);
    const color = chalk.hex(colors[i]);
    const tag = item.versionString === trimmedLatestVersion ? 'latest' : '';

    console.log(`${version.padStart(8)} ${color(chart)} ${color(downloads.padStart(6))} ${tag}`);
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

import chalk from 'chalk';

import { renderChart } from './chart.js';
import { parseCliOptions, showHelp } from './cli-options.js';
import { getColors } from './colors.js';
import { fetchNpmLastWeekDownloads, type NpmLastWeekDownloadsResponse } from './npm-api.js';
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

  let data: NpmLastWeekDownloadsResponse;
  try {
    data = await fetchNpmLastWeekDownloads(options.packageName);
  } catch (error) {
    console.error(`Failed to fetch data for package "${options.packageName}"`, error);
    return;
  }

  if (!Object.keys(data.downloads).length) {
    console.error(`No data found for package "${options.packageName}".\n`);
    process.exit(1);
  }

  const rawStats = Object.keys(data.downloads)
    .map((versionString) => {
      const version = parseVersion(versionString);
      return {
        ...version,
        downloads: data.downloads[versionString],
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
  const primaryColor = chalk.hex(colors[0]);

  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(options.packageName)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

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

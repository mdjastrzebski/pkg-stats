import chalk from 'chalk';

import { renderChart } from './chart.js';
import { parseCliOptions, showHelp } from './cli-options.js';
import { getColors } from './colors.js';
import { formatDownloads } from './format.js';
import { fetchNpmLastWeekDownloads, type NpmLastWeekDownloadsResponse } from './npm-api.js';
import { groupStats, pickTopStats } from './stats.js';
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

  const statsToDisplay = options.top ? pickTopStats(stats, options.top) : stats;
  const colors = getColors(statsToDisplay.length, options.color);
  const primaryColor = chalk.hex(colors[0]);

  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(options.packageName)}\n`));
  console.log(`Total: ${primaryColor(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} ${type} versions:\n` : `By ${type} version:\n`);

  const maxDownloads = Math.max(...stats.map((v) => v.downloads));
  statsToDisplay.forEach((item, i) => {
    const versionParts = item.versionString.split('.');
    const versionString = versionParts.length < 3 ? `${item.versionString}.x` : item.versionString;
    const chart = renderChart(item.downloads / maxDownloads);
    const downloads = formatDownloads(item.downloads, maxDownloads);
    const color = chalk.hex(colors[i]);

    console.log(`${versionString.padStart(8)} ${color(chart)} ${color(downloads.padStart(6))}`);
  });

  console.log('');
}

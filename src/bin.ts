import chalk from 'chalk';

import { renderChart } from './chart.js';
import { parseCliOptions, showHelp } from './cli-options.js';
import { getColors } from './colors.js';
import { formatDownloads } from './format.js';
import { type NpmLastWeekDownloadsResponse, fetchNpmLastWeekDownloads } from './npm-api.js';
import { type GroupType, type GroupedStats, groupStats, pickTopStats } from './stats.js';
import { parseVersion, versionCompare } from './version.js';

export async function pkgStats(argv: string[]) {
  let parsedOptions: ReturnType<typeof parseCliOptions>;

  try {
    parsedOptions = parseCliOptions(argv);
  } catch (error) {
    showHelp();

    console.error(
      chalk.red(`Error parsing CLI options: ${error instanceof Error ? error.message : error}`),
    );
    process.exit(2);
  }

  const { packageNames, ...cliOptions } = parsedOptions;

  const dataPromises = packageNames.map((packageName) =>
    fetchNpmLastWeekDownloads(packageName).catch((error) => {
      console.error(`Failed to fetch data for package "${packageName}"`, error);
      return null;
    }),
  );

  const dataArray = await Promise.all(dataPromises);

  const validData = dataArray.filter((data): data is NpmLastWeekDownloadsResponse => data !== null);

  if (validData.length === 0) {
    console.error('Failed to fetch data for all specified packages.');
    process.exit(1);
  }

  function generatePackageLine(
    packageName: string,
    totalDownloads: number,
    type: GroupType,
    statsToDisplay: GroupedStats[],
    colors: string[],
    maxDownloads: number,
  ) {
    const lines: string[] = [];
    lines.push(chalk.bold(`NPM weekly downloads for ${chalk.hex(colors[0])(packageName)}`));
    lines.push(`Total: ${chalk.hex(colors[0])(totalDownloads.toLocaleString())} last week`);
    lines.push(cliOptions.top ? `Top ${cliOptions.top} ${type} versions:` : `By ${type} version:`);

    statsToDisplay.forEach((item, i) => {
      const versionString =
        item.versionString.split('.').length < 3 ? `${item.versionString}.x` : item.versionString;

      const chart = renderChart(item.downloads / maxDownloads);
      const downloads = formatDownloads(item.downloads);
      const color = chalk.hex(colors[i % colors.length]);

      lines.push(`${versionString.padStart(8)} ${color(chart)} ${color(downloads.padStart(6))}`);
    });

    lines.push(''); // Extra empty line for separation

    return lines;
  }

  const packageData: { lines: string[]; maxDownloads: number }[] = validData.map((data) => {
    const npmStats = Object.keys(data.downloads)
      .map((versionString) => {
        const version = parseVersion(versionString);
        return {
          ...version,
          downloads: data.downloads[versionString],
        };
      })
      .sort(versionCompare);

    const { type, stats } = groupStats(npmStats, cliOptions.group);
    const totalDownloads = stats.reduce((sum, version) => sum + version.downloads, 0);
    const statsToDisplay = cliOptions.top ? pickTopStats(stats, cliOptions.top) : stats;
    const maxDownloads = Math.max(...stats.map((v) => v.downloads));

    const numColorsNeeded = Math.min(statsToDisplay.length, 5);
    const generatedColors = getColors(numColorsNeeded, cliOptions.color);

    const colors = Array.from(
      { length: numColorsNeeded },
      (_, index) => generatedColors[index],
    );

    const lines = generatePackageLine(
      data.package,
      totalDownloads,
      type,
      statsToDisplay,
      colors,
      maxDownloads,
    );

    return { lines, maxDownloads };
  });

  console.log('\n'); // Initial spacing
  packageData.forEach(({ lines }, index) => {
    for (const line of lines) {
      console.log(line);
    }

    if (index < packageData.length - 1) {
      console.log('');
    }
  });
}

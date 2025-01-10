import chalk from 'chalk';
import minimist from 'minimist';

import { renderChart } from './chart.js';
import { getColors } from './colors.js';
import { fetchNpmLastWeekDownloads, type NpmLastWeekDownloadsResponse } from './npm-api.js';
import { groupByType, type GroupedStats, type GroupType, pickTopStats } from './stats.js';
import { parseVersion, versionCompare } from './version.js';

type MinimistOptions = {
  group?: string;
  top?: string;
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
};

type CliOptions = {
  help?: boolean;
  name: string;
  group?: 'major' | 'minor' | 'patch';
  top?: number;
};

export async function pkgStats(argv: string[]) {
  const options = parseCliOptions(argv);
  if (options.help) {
    printHelp();
    return;
  }

  let data: NpmLastWeekDownloadsResponse;
  try {
    data = await fetchNpmLastWeekDownloads(options.name);
  } catch (error) {
    console.error(`Failed to fetch data for package "${options.name}"`, error);
    return;
  }

  if (!Object.keys(data.downloads).length) {
    console.error(`No data found for package "${options.name}".\n`);
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

  const colors = getColors(groupedStatsToDisplay.length);
  const primaryColor = chalk.hex(colors[0]);

  console.log(chalk.bold(`\nNPM weekly downloads for ${primaryColor(options.name)}\n`));
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

function parseCliOptions(argv: string[]): CliOptions {
  const options = minimist<MinimistOptions>(argv, {
    string: ['group', 'top'],
    boolean: ['help'],
    alias: { g: 'group', h: 'help', t: 'top' },
  });

  let group: GroupType | undefined;
  if (options.group === 'major' || options.major) {
    group = 'major';
  } else if (options.group === 'minor' || options.minor) {
    group = 'minor';
  } else if (options.group === 'patch' || options.patch) {
    group = 'patch';
  }

  const top = options.top ? parseInt(options.top) : undefined;

  if (!options._[0]) {
    console.error('Package name is required');
    process.exit(1);
  }

  return { name: options._[0], group, help: options.help, top };
}

function printHelp() {
  console.log(`
    Usage:
      pkg-stats [options] <package-name>

    Options:
      -h, --help       Show help
      --group <group>  Group by major, minor, or patch (default: major)
      --major          Group by major
      --minor          Group by minor
      --patch          Group by patch
      --top <number>   Show top <number> versions
  `);
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

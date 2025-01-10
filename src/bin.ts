import chalk from 'chalk';
import minimist from 'minimist';
import { renderChart } from './chart.js';
import { getColors } from './colors.js';
import { parseVersion, Version, versionCompare } from './version.js';

type VersionStats = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  downloads: number;
};

type MinimistOptions = {
  group?: string;
  top?: string;
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
};

type GroupType = 'major' | 'minor' | 'patch';

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

  let data: any;
  try {
    const response = await fetch(
      `https://api.npmjs.org/versions/${encodeURIComponent(options.name)}/last-week`,
    );
    data = await response.json();
  } catch (error) {
    console.error(`Failed to fetch data for package "${options.name}"`);
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

  let groupedStats: GroupedStats[];
  if (options.group === 'patch') {
    groupedStats = sumByPatch(rawStats);
  } else if (options.group === 'minor') {
    groupedStats = sumByMinor(rawStats);
  } else {
    groupedStats = sumByMajor(rawStats);
  }

  const totalDownloads = Object.values(groupedStats).reduce(
    (sum, version) => sum + version.downloads,
    0,
  );

  const groupedStatsToDisplay = options.top
    ? pickTopStats(groupedStats, options.top)
    : groupedStats;

  console.log(chalk.bold(`\nNPM weekly downloads for ${chalk.cyan(options.name)}\n`));
  console.log(`Total: ${chalk.cyan(totalDownloads.toLocaleString())} last week\n`);

  console.log(options.top ? `Top ${options.top} versions:\n` : 'By version:\n');

  const colors = getColors(groupedStatsToDisplay.length, 'summer');
  const maxDownloads = Math.max(...groupedStats.map((v) => v.downloads));

  groupedStatsToDisplay.forEach((item, i) => {
    const version = options.group != 'patch' ? `${item.versionString}.x` : item.versionString;
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

  let group: GroupType = 'major';
  if (options.group === 'minor' || options.minor) {
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

type GroupedStats = {
  version: Version;
  versionString: string;
  downloads: number;
};

function sumByMajor(stats: VersionStats[]): GroupedStats[] {
  const result: Record<string, GroupedStats> = {};
  for (const versionStats of stats) {
    const key = `${versionStats.major}`;
    const entry = result[key] ?? {
      version: { major: versionStats.major },
      versionString: key,
      downloads: 0,
    };

    result[key] = entry;
    entry.downloads += versionStats.downloads;
  }

  return Object.values(result).sort((a, b) => versionCompare(a.version, b.version));
}

function sumByMinor(stats: VersionStats[]) {
  const result: Record<string, GroupedStats> = {};
  for (const versionStats of stats) {
    const key = `${versionStats.major}.${versionStats.minor}`;
    const entry = result[key] ?? {
      version: { major: versionStats.major, minor: versionStats.minor },
      versionString: key,
      downloads: 0,
    };

    result[key] = entry;
    entry.downloads += versionStats.downloads;
  }

  return Object.values(result).sort((a, b) => versionCompare(a.version, b.version));
}

function sumByPatch(stats: VersionStats[]) {
  const result: Record<string, GroupedStats> = {};
  for (const versionStats of stats) {
    const key = `${versionStats.major}.${versionStats.minor}.${versionStats.patch}`;
    const entry = result[key] ?? {
      version: {
        major: versionStats.major,
        minor: versionStats.minor,
        patch: versionStats.patch,
      },
      versionString: key,
      downloads: 0,
    };

    result[key] = entry;
    entry.downloads += versionStats.downloads;
  }

  return Object.values(result).sort((a, b) => versionCompare(a.version, b.version));
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

function pickTopStats(stats: GroupedStats[], top: number) {
  const sortedStats = stats.sort((a, b) => b.downloads - a.downloads);
  const topStats = sortedStats.slice(0, top);
  return topStats.sort((a, b) => versionCompare(a.version, b.version));
}

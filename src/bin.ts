import chalk from 'chalk';
import minimist from 'minimist';
import { renderChart } from './chart.js';
import { gradients } from './colors.js';
import { parseVersion, Version, versionCompare } from './version.js';

const PACKAGE_NAME = process.argv[2];

const NPM_STATS_URL = `https://api.npmjs.org/versions/${encodeURIComponent(
  PACKAGE_NAME,
)}/last-week`;

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

type CliOptions = {
  help?: boolean;
  group?: 'major' | 'minor' | 'patch';
  top?: number;
};

export async function bin() {
  const options = parseCliOptions(process.argv);

  if (options.help) {
    printHelp();
    return;
  }

  const response = await fetch(NPM_STATS_URL);
  const data = await response.json();

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

  console.log(`NPM weekly downloads for "${PACKAGE_NAME}"\n`);
  console.log(`Total: ${totalDownloads.toLocaleString()}\n`);

  console.log(options.top ? `Top ${options.top} versions:\n` : 'By version:\n');

  const colors = gradients.passion(groupedStatsToDisplay.length);
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

function parseCliOptions(argv: string[]) {
  const options = minimist<MinimistOptions>(argv, {
    string: ['group', 'top'],
    boolean: ['help'],
    alias: { g: 'group', h: 'help', t: 'top' },
  });

  let group = options.group;
  if (!group) {
    if (options.major) {
      group = 'major';
    } else if (options.minor) {
      group = 'minor';
    } else if (options.patch) {
      group = 'patch';
    }
  }

  const top = options.top ? parseInt(options.top) : undefined;

  return { name: options._[0], group: group ?? 'major', help: options.help, top };
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

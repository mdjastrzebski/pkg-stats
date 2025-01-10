import { Version, versionCompare } from './version.js';

export type NpmStats = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  downloads: number;
};

export type GroupedStats = {
  version: Version;
  versionString: string;
  downloads: number;
};

export type GroupType = 'major' | 'minor' | 'patch';

export function groupByType(type: GroupType | undefined, stats: NpmStats[]): GroupedStats[] {
  if (type === 'major') {
    return groupByMajor(stats);
  }

  if (type === 'minor') {
    return groupByMinor(stats);
  }

  if (type === 'patch') {
    return groupByPatch(stats);
  }

  const groupedByMajor = groupByMajor(stats);
  if (groupedByMajor.length > 1) {
    return groupedByMajor;
  }

  const groupedByMinor = groupByMinor(stats);
  if (groupedByMinor.length > 1) {
    return groupedByMinor;
  }

  return groupByPatch(stats);
}

function groupByMajor(stats: NpmStats[]): GroupedStats[] {
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

function groupByMinor(stats: NpmStats[]) {
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

function groupByPatch(stats: NpmStats[]) {
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

export function pickTopStats(stats: GroupedStats[], top: number) {
  const sortedStats = stats.sort((a, b) => b.downloads - a.downloads);
  const topStats = sortedStats.slice(0, top);
  return topStats.sort((a, b) => versionCompare(a.version, b.version));
}

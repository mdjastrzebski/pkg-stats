import { versionCompare, type VersionGroup } from './version.js';

export type NpmStats = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  downloads: number;
};

export type GroupType = 'major' | 'minor' | 'patch';

export type GroupStats = {
  version: VersionGroup;
  versionString: string;
  downloads: number;
};

export type GroupStatsResult = {
  type: GroupType;
  stats: GroupStats[];
};

export type DisplayStats = {
  versionString: string;
  downloads: number;
};

export function groupStats(stats: NpmStats[], type: GroupType | undefined): GroupStatsResult {
  if (type === 'major') {
    return { type: 'major', stats: groupByMajor(stats) };
  }

  if (type === 'minor') {
    return { type: 'minor', stats: groupByMinor(stats) };
  }

  if (type === 'patch') {
    return { type: 'patch', stats: groupByPatch(stats) };
  }

  const groupedByMajor = groupByMajor(stats);
  if (groupedByMajor.length >= 3) {
    return { type: 'major', stats: groupedByMajor };
  }

  const groupedByMinor = groupByMinor(stats);
  if (groupedByMinor.length >= 3) {
    return { type: 'minor', stats: groupedByMinor };
  }

  return { type: 'patch', stats: groupByPatch(stats) };
}

function groupByMajor(stats: NpmStats[]): GroupStats[] {
  const result: Record<string, GroupStats> = {};
  for (const versionStats of stats) {
    const key = `${versionStats.major}.x`;
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
  const result: Record<string, GroupStats> = {};
  for (const versionStats of stats) {
    const key = `${versionStats.major}.${versionStats.minor}.x`;
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
  const result: Record<string, GroupStats> = {};
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

export type FilterStatsOptions = {
  totalDownloads: number;
  all?: boolean;
  top?: number;
};

export function filterStats(stats: GroupStats[], options: FilterStatsOptions) {
  if (options.all) {
    return stats;
  }

  if (options.top) {
    return pickTopStats(stats, options.top);
  }

  const downloadThreshold = 0.005 * options.totalDownloads; // 0.5%
  return stats.filter((stat) => stat.downloads >= downloadThreshold);
}

function pickTopStats(stats: GroupStats[], top: number) {
  const sortedStats = stats.sort((a, b) => b.downloads - a.downloads);
  const topStats = sortedStats.slice(0, top);
  return topStats.sort((a, b) => versionCompare(a.version, b.version));
}

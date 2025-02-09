import { type VersionDownloads } from './version.js';

export type VersionGroup = MajorVersion | MinorVersion | PatchVersion;
export type VersionGroupType = 'major' | 'minor' | 'patch';

type MajorVersion = {
  major: number;
  minor?: undefined;
  patch?: undefined;
};

type MinorVersion = {
  major: number;
  minor: number;
  patch?: undefined;
};

type PatchVersion = {
  major: number;
  minor: number;
  patch: number;
};

export function versionGroupCompare(a: VersionGroup, b: VersionGroup) {
  if (a.major !== b.major) {
    return b.major - a.major;
  }

  if (a.minor !== undefined && b.minor !== undefined && a.minor !== b.minor) {
    return b.minor - a.minor;
  }

  if (a.patch !== undefined && b.patch !== undefined && a.patch !== b.patch) {
    return b.patch - a.patch;
  }

  return 0;
}

export type VersionGroupDownloads = {
  version: VersionGroup;
  versionString: string;
  downloads: number;
};

export type GroupDownloadsResult = {
  type: VersionGroupType;
  groups: VersionGroupDownloads[];
};

export function groupDownloads(
  versions: VersionDownloads[],
  type: VersionGroupType | undefined,
): GroupDownloadsResult {
  // Explicit grouping
  if (type) {
    return { type, groups: groupByType(versions, type) };
  }

  // Implicit grouping
  const groupedByMajor = groupByType(versions, 'major');
  if (groupedByMajor.length >= 3) {
    return { type: 'major', groups: groupedByMajor };
  }

  const groupedByMinor = groupByType(versions, 'minor');
  if (groupedByMinor.length >= 3) {
    return { type: 'minor', groups: groupedByMinor };
  }

  const groupedByPatch = groupByType(versions, 'patch');
  return { type: 'patch', groups: groupedByPatch };
}

function formatVersionByType(version: VersionGroup, type: VersionGroupType) {
  if (type === 'major') {
    return `${version.major}.x`;
  }

  if (type === 'minor') {
    return `${version.major}.${version.minor}.x`;
  }

  return `${version.major}.${version.minor}.${version.patch}`;
}

function groupByType(
  versions: VersionDownloads[],
  type: VersionGroupType,
): VersionGroupDownloads[] {
  const result: Record<string, VersionGroupDownloads> = {};
  for (const { version, downloads } of versions) {
    const key = formatVersionByType(version, type);
    const entry = result[key] ?? {
      version,
      versionString: key,
      downloads,
    };

    entry.downloads += downloads;
    result[key] = entry;
  }

  return Object.values(result).sort((a, b) => versionGroupCompare(a.version, b.version));
}

export type FilterGroupsOptions = {
  min: number;
  all?: boolean;
  top?: number;
};

export function filterGroups(groups: VersionGroupDownloads[], options: FilterGroupsOptions) {
  if (options.all) {
    return groups;
  }

  if (options.top) {
    return pickTopGroups(groups, options.top);
  }

  const filtered = groups.filter((stat) => stat.downloads >= options.min);

  // If we were to skip only a single state, we rather display it than replace it with "rest".
  if (filtered.length + 1 >= groups.length) {
    return groups;
  }

  return filtered;
}

function pickTopGroups(groups: VersionGroupDownloads[], top: number) {
  const sorted = groups.sort((a, b) => b.downloads - a.downloads);
  return sorted.slice(0, top).sort((a, b) => versionGroupCompare(a.version, b.version));
}

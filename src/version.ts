export type Version = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
};

export type VersionGroup = MajorVersionGroup | MinorVersionGroup | PatchVersionGroup;

type MajorVersionGroup = {
  major: number;
  minor?: undefined;
  patch?: undefined;
};

type MinorVersionGroup = {
  major: number;
  minor: number;
  patch?: undefined;
};

type PatchVersionGroup = {
  major: number;
  minor: number;
  patch: number;
};

export function parseVersion(version: string): Version {
  const [versionCore, preRelease] = version.split('-');
  const [major, minor, patch] = versionCore.split('.');
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    preRelease,
  };
}

export function versionCompare(a: VersionGroup, b: VersionGroup) {
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

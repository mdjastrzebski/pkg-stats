export type Version = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
};

export type PartialVersion = {
  major: number;
  minor?: number;
  patch?: number;
  preRelease?: string;
};

export function parseVersion(version: string): Version {
  const [versionCore, preRelease] = version.split("-");
  const [major, minor, patch] = versionCore.split(".");
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    preRelease,
  };
}

export function versionCompare(a: PartialVersion, b: PartialVersion) {
  if (a.major !== b.major) {
    return b.major - a.major;
  }

  if (a.minor !== undefined && b.minor !== undefined && a.minor !== b.minor) {
    return b.minor - a.minor;
  }

  if (a.patch !== undefined && b.patch !== undefined && a.patch !== b.patch) {
    return b.patch - a.patch;
  }

  if (a.preRelease !== undefined && b.preRelease !== undefined) {
    return a.preRelease.localeCompare(b.preRelease);
  }

  return 0;
}

import { type NpmVersionsLastWeekResponse } from '../network/npm-api.js';

export type Version = {
  major: number;
  minor: number;
  patch: number;
  preRelease: string | undefined;
  build: string | undefined;
};

export function parseVersion(version: string): Version {
  const [versionExBuild, build] = version.split('+');
  const [versionExPreRelease, preRelease] = versionExBuild.split('-');
  const [major, minor, patch] = versionExPreRelease.split('.');
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    preRelease,
    build,
  };
}

export type VersionDownloads = {
  version: Version;
  downloads: number;
};

export function parseVersionDownloads(response: NpmVersionsLastWeekResponse): VersionDownloads[] {
  const npmStats = Object.keys(response.downloads).map((versionString) => {
    const version = parseVersion(versionString);
    return {
      version,
      downloads: response.downloads[versionString],
    };
  });

  return npmStats;
}

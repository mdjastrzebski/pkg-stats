import { renderChart } from "./chart.js";
import { parseVersion, Version, versionCompare } from "./version.js";

const PACKAGE_NAME = process.argv[2];

const NPM_STATS_URL = `https://api.npmjs.org/versions/${encodeURIComponent(
  PACKAGE_NAME
)}/last-week`;

type VersionStats = {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  downloads: number;
};

export async function bin() {
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

  const groupedStats = sumByMajor(rawStats);
  const totalDownloads = Object.values(groupedStats).reduce(
    (sum, version) => sum + version.downloads,
    0
  );

  console.log(`${PACKAGE_NAME} weekly downloads\n`);
  console.log(`Total: ${totalDownloads.toLocaleString()}.\n`);

  console.log("By version:\n");
  const maxDownloads = Math.max(...groupedStats.map((v) => v.downloads));
  for (const item of groupedStats) {
    console.log(
      `${item.versionString.padStart(6)} ${renderChart(
        item.downloads / maxDownloads
      )} ${formatDownloads(item.downloads, maxDownloads).padStart(6)}`
    );
  }

  console.log(
    `\nGenerated on ${new Date().toISOString().slice(0, 10)} by npm-stats.`
  );
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

  return Object.values(result).sort((a, b) =>
    versionCompare(a.version, b.version)
  );
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

  return Object.values(result).sort((a, b) =>
    versionCompare(a.version, b.version)
  );
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

  return Object.values(result).sort((a, b) =>
    versionCompare(a.version, b.version)
  );
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

import { getCachedLastWeekDownloads, setCachedLastWeekDownloads } from './cache.js';

const CACHE_LIFETIME = 15 * 60 * 1000; // 15 minutes

export type NpmLastWeekDownloadsResponse = {
  package: string;
  downloads: Record<string, number>;
};

export async function fetchNpmLastWeekDownloads(
  packageName: string,
): Promise<NpmLastWeekDownloadsResponse> {
  const cached = getCachedLastWeekDownloads(packageName);
  if (cached && Date.now() - cached.latest.timestamp < CACHE_LIFETIME) {
    console.log(
      `Using cached data for ${packageName}`,
      new Date(cached.latest.timestamp).toLocaleString(),
    );
    return cached.latest.response;
  }

  const response = await fetch(
    `https://api.npmjs.org/versions/${encodeURIComponent(packageName)}/last-week`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch data for package "${packageName}. Status: ${response.status}`);
  }

  const json = await response.json();
  if (!json.downloads) {
    throw new Error('No downloads found');
  }

  const result = {
    package: packageName,
    downloads: json.downloads,
  };

  setCachedLastWeekDownloads(packageName, result);

  return result;
}

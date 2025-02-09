import fs, { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { fetchNpmLastWeekDownloads } from './npm-api.js';

const CACHE_PATH = path.join(os.homedir(), '.pkg-stats/versions-last-week.json');
const CACHE_LIFETIME = 15 * 60 * 1000; // 15 min

export type LastWeekDownloadsCacheEntry = {
  packageName: string;
  last: NpmLastWeekDownloadsFetch;
  previous?: NpmLastWeekDownloadsFetch;
};

type NpmLastWeekDownloadsFetch = {
  timestamp: number;
  downloads: Record<string, number>;
};

let _cache: Record<string, LastWeekDownloadsCacheEntry>;

export async function getLastWeeksDownloads(
  packageName: string,
): Promise<LastWeekDownloadsCacheEntry> {
  loadCacheIfNeeded();
  const entry = _cache[packageName];
  if (entry && Date.now() - entry.last.timestamp < CACHE_LIFETIME) {
    return entry;
  }

  const fresh = await fetchNpmLastWeekDownloads(packageName);
  const newEntry = {
    packageName,
    last: {
      timestamp: Date.now(),
      downloads: fresh.downloads,
    },
    previous: entry?.last,
  };

  _cache[packageName] = newEntry;
  saveCache();

  return newEntry;
}

function loadCacheIfNeeded() {
  if (_cache) {
    return;
  }

  if (!fs.existsSync(CACHE_PATH)) {
    return (_cache = {});
  }

  try {
    const data = fs.readFileSync(CACHE_PATH, 'utf8');
    return (_cache = JSON.parse(data));
  } catch {
    return (_cache = {});
  }
}

function saveCache() {
  if (!_cache) {
    throw new Error('Cache not loaded');
  }

  try {
    mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(_cache, null, 2));
  } catch (error) {
    console.warn('Failed to save cache', error);
  }
}

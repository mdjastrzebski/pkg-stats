import fs, { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { type NpmLastWeekDownloadsResponse } from './npm-api.js';

type CacheEntry = {
  timestamp: number;
  value: NpmLastWeekDownloadsResponse;
};

const CACHE_PATH = path.join(os.homedir(), '.pkg-stats/versions-last-week.json');

export function getCachedLastWeekDownloads(packageName: string): CacheEntry | undefined {
  const cache = getCacheEntries();
  return cache[packageName];
}

export function setCachedLastWeekDownloads(
  packageName: string,
  data: NpmLastWeekDownloadsResponse,
) {
  const cache = getCacheEntries();
  cache[packageName] = {
    timestamp: Date.now(),
    value: data,
  };

  writeCache(cache);
}

let _cache: Record<string, CacheEntry> | undefined;

function getCacheEntries(): Record<string, CacheEntry> {
  if (_cache) {
    return _cache;
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

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Failed to save cache', error);
  }
}

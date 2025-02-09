import fs, { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { type NpmLastWeekDownloadsResponse } from './npm-api.js';

const CACHE_PATH = path.join(os.homedir(), '.pkg-stats/versions-last-week.json');
const CURRENT_SCHEMA_VERSION = 1;

type Cache = {
  schemaVersion: number;
  entries: Record<string, CacheEntry>;
};

type CacheEntry = {
  latest: {
    timestamp: number;
    response: NpmLastWeekDownloadsResponse;
  };
};

let loadedCache: Cache;
const emptyCache: Cache = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  entries: {},
};

export function getCachedLastWeekDownloads(packageName: string): CacheEntry | undefined {
  loadCacheIfNeeded();
  return loadedCache.entries[packageName];
}

export function setCachedLastWeekDownloads(
  packageName: string,
  response: NpmLastWeekDownloadsResponse,
) {
  loadCacheIfNeeded();
  loadedCache.entries[packageName] = {
    latest: {
      timestamp: Date.now(),
      response,
    },
  };

  saveCache();
}

function loadCacheIfNeeded() {
  if (loadedCache) {
    return;
  }

  if (!fs.existsSync(CACHE_PATH)) {
    loadedCache = { ...emptyCache };
  }

  try {
    const data = fs.readFileSync(CACHE_PATH, 'utf8');
    loadedCache = JSON.parse(data);

    if (loadedCache.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      loadedCache = { ...emptyCache };
    }
  } catch {
    loadedCache = { ...emptyCache };
  }
}

function saveCache() {
  try {
    mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(loadedCache, null, 2));
  } catch (error) {
    console.warn('Failed to save cache', error);
  }
}

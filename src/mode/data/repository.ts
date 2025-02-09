import fs, { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { logger } from '../../utils/logger.js';
import { fetchNpmVersionsLastWeek, type NpmVersionsLastWeekResponse } from '../network/npm-api.js';

const SCHEMA_VERSION = 1;
const STORAGE_PATH = path.join(os.homedir(), '.pkg-stats/versions-last-week.json');
const CACHE_LIFETIME = 15 * 60 * 1000; // 15 minutes

type Store = {
  schemaVersion: number;
  entries: Record<string, StoreEntry>;
};

type StoreEntry = {
  latest: {
    timestamp: number;
    response: NpmVersionsLastWeekResponse;
  };
};

let store: Store;
const emptyCache: Store = {
  schemaVersion: SCHEMA_VERSION,
  entries: {},
};

export async function getVersionsLastWeek(
  packageName: string,
): Promise<NpmVersionsLastWeekResponse> {
  loadStoreIfNeeded();
  const now = Date.now();
  const latest = store.entries[packageName]?.latest;
  if (latest && now - latest.timestamp < CACHE_LIFETIME) {
    logger.debug(`Using cached response for ${packageName}`);
    return latest.response;
  }

  const response = await fetchNpmVersionsLastWeek(packageName);
  store.entries[packageName] = {
    latest: {
      timestamp: now,
      response,
    },
  };

  logger.debug(`Caching response for ${packageName}`);
  persistStore();

  return response;
}

function loadStoreIfNeeded() {
  if (store) {
    return;
  }

  if (!fs.existsSync(STORAGE_PATH)) {
    logger.debug(`Cache storage not found: ${STORAGE_PATH}`);
    store = { ...emptyCache };
  }

  try {
    const data = fs.readFileSync(STORAGE_PATH, 'utf8');
    store = JSON.parse(data);

    if (store.schemaVersion !== SCHEMA_VERSION) {
      logger.debug(`Cache schema version mismatch: ${store.schemaVersion}`);
      store = { ...emptyCache };
    }
  } catch (error) {
    logger.warn(`Failed to load cache`, error);
    store = { ...emptyCache };
  }
}

function persistStore() {
  try {
    mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(store, null, 2));
  } catch (error) {
    logger.warn('Failed to save cache', error);
  }
}

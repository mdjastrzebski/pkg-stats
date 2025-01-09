#!/usr/bin/env node

import { pkgStats } from './dist/index.js';

pkgStats(process.argv.slice(2));

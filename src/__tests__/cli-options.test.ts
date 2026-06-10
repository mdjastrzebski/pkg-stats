import { expect, test } from 'vitest';

import { parseCliOptions } from '../cli-options.js';

test('parseCliOptions defaults to version sorting', () => {
  const options = parseCliOptions(['node', 'pkg-stats', 'react', '--color', 'atlas']);

  expect(options.sort).toBe('version');
});

test('parseCliOptions supports download sorting', () => {
  const options = parseCliOptions([
    'node',
    'pkg-stats',
    'react',
    '--sort',
    'downloads',
    '--color',
    'atlas',
  ]);

  expect(options.sort).toBe('downloads');
});

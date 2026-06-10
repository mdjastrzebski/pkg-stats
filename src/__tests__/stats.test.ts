import { expect, test } from 'vitest';

import { downloadCompare, filterStats, type GroupStats } from '../stats.js';

const stats: GroupStats[] = [
  {
    version: { major: 3 },
    versionString: '3.x',
    downloads: 100,
  },
  {
    version: { major: 2 },
    versionString: '2.x',
    downloads: 300,
  },
  {
    version: { major: 1 },
    versionString: '1.x',
    downloads: 200,
  },
];

test('filterStats keeps top downloads in version order by default', () => {
  expect(
    filterStats(stats, {
      totalDownloads: 600,
      top: 2,
    }).map((stat) => stat.versionString),
  ).toEqual(['2.x', '1.x']);
});

test('downloadCompare sorts by downloads descending', () => {
  expect([...stats].sort(downloadCompare).map((stat) => stat.versionString)).toEqual([
    '2.x',
    '1.x',
    '3.x',
  ]);
});

test('downloadCompare falls back to version order for ties', () => {
  const tiedStats: GroupStats[] = [
    {
      version: { major: 1 },
      versionString: '1.x',
      downloads: 100,
    },
    {
      version: { major: 2 },
      versionString: '2.x',
      downloads: 100,
    },
  ];

  expect([...tiedStats].sort(downloadCompare).map((stat) => stat.versionString)).toEqual([
    '2.x',
    '1.x',
  ]);
});

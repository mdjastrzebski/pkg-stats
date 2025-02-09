import { expect, test } from 'vitest';

import { formatBar } from '../chart.js';

test('renderChart basic tests', () => {
  expect(formatBar(0.0, { length: 10 })).toMatchInlineSnapshot(`"▏         "`);
  expect(formatBar(0.5, { length: 10 })).toMatchInlineSnapshot(`"█████     "`);
  expect(formatBar(1.0, { length: 10 })).toMatchInlineSnapshot(`"██████████"`);
});

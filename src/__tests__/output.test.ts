import { expect, test } from 'vitest';

import { formatBar } from '../output.js';

test('renderChart basic tests', () => {
  expect(formatBar(0.0, { width: 10 })).toMatchInlineSnapshot(`"▏         "`);
  expect(formatBar(0.5, { width: 10 })).toMatchInlineSnapshot(`"█████     "`);
  expect(formatBar(1.0, { width: 10 })).toMatchInlineSnapshot(`"██████████"`);
});

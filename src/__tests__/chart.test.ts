import { expect, test } from 'vitest';

import { renderChart } from '../chart.js';

test('renderChart basic tests', () => {
  expect(renderChart(0.0, { length: 10 })).toMatchInlineSnapshot(`"          "`);
  expect(renderChart(0.5, { length: 10 })).toMatchInlineSnapshot(`"█████     "`);
  expect(renderChart(1.0, { length: 10 })).toMatchInlineSnapshot(`"██████████"`);
});

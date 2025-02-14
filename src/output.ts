import chalk from 'chalk';

import { type ColorScheme, getColors } from './colors.js';
import { formatDownloads } from './format.js';

export type ChartItem = {
  label: string;
  value: number;
  extended?: string;
};

export type PrintChartOptions = {
  colorScheme: ColorScheme;
  indent?: number;
};

export function printChart(items: ChartItem[], options: PrintChartOptions) {
  const maxLabelLength = Math.max(...items.map((item) => item.label.length));

  const maxValue = Math.max(...items.map((item) => item.value));
  const maxValueLength = formatDownloads(maxValue, maxValue).length;
  const maxExtendedLength = Math.max(...items.map((item) => item.extended?.length ?? 0));

  const colors = getColors(items.length, options.colorScheme);
  const indent = options.indent ?? 0;

  items.forEach((item, i) => {
    const color = chalk.hex(colors[i]);
    const label = ' '.repeat(indent) + item.label.padStart(maxLabelLength);
    const bar = formatBar(item.value / maxValue);
    const value = formatDownloads(item.value, maxValue).padStart(maxValueLength);
    const extended = item.extended
      ? chalk.dim(` ${item.extended}`.padStart(maxExtendedLength + 1))
      : '';

    console.log(`${label} ${color(bar)} ${color(value)}${extended}`);
  });
}

type FormatBarOptions = {
  length?: number;
};

export function formatBar(value: number, { length = 50 }: FormatBarOptions = {}) {
  const filledChars = Math.round(value * length);
  if (filledChars === 0) {
    return '▏' + ' '.repeat(length - 1);
  }

  return '█'.repeat(filledChars) + ' '.repeat(length - filledChars);
}

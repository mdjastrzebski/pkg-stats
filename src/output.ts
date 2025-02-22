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

  const chartWidth =
    getTerminalWidth() - indent - maxLabelLength - maxValueLength - maxExtendedLength - 4;

  items.forEach((item, i) => {
    const color = chalk.hex(colors[i]);
    const label = ' '.repeat(indent) + item.label.padStart(maxLabelLength);
    const bar = formatBar(item.value / maxValue, { width: clamp(chartWidth, 30, 60) });
    const value = formatDownloads(item.value, maxValue).padStart(maxValueLength);
    const extended = item.extended
      ? chalk.dim(` ${item.extended}`.padStart(maxExtendedLength + 1))
      : '';

    console.log(`${label} ${color(bar)} ${color(value)}${extended}`);
  });
}

type FormatBarOptions = {
  width?: number;
};

export function formatBar(value: number, { width = 50 }: FormatBarOptions = {}) {
  const filledChars = Math.round(value * width);
  if (filledChars === 0) {
    return '▏' + ' '.repeat(width - 1);
  }

  return '█'.repeat(filledChars) + ' '.repeat(width - filledChars);
}

export function getTerminalWidth() {
  return process.stdout.columns;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

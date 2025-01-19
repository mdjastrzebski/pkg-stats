export type RenderChartOptions = {
  length?: number;
};

export function renderChart(value: number, { length = 50 }: RenderChartOptions = {}) {
  const filledChars = Math.round(value * length);
  if (filledChars === 0) {
    return '▏' + ' '.repeat(length - 1);
  }

  return '█'.repeat(filledChars) + ' '.repeat(length - filledChars);
}
